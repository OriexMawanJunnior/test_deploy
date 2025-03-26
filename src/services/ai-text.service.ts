import { generateText } from "ai"
import { createOpenAI, openai } from "@ai-sdk/openai"
import { anthropic, createAnthropic } from "@ai-sdk/anthropic"
import { createMistral, mistral } from "@ai-sdk/mistral"
import { createGoogleGenerativeAI, google } from "@ai-sdk/google"
import { db } from "./db.service";
import { Request, Response, text } from "express"
import { createQwen } from "qwen-ai-provider"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createTogetherAI } from "@ai-sdk/togetherai"
import { handleTranslation } from "./translation-sdks.service"
import { SourceLanguageCode, TargetLanguageCode } from "deepl-node"
import { supabase } from "../lib/supabaseClient"
import { handleSearch } from "./search-sdks.service"
import { handleVideoGeneration } from "./text-to-video-sdks.service"
import { createResponse, isValidUUID } from "../helpers/response.helper"
import { inlineValidate } from "../middleware/validate"
import { imageGenerationSchema } from "../schemas/image.schema"
import { handleTextToImageGeneration } from "./text-to-image-sdks.service"
import { reqBodyVideoGenerationSchema } from "../schemas/video.schema"

export type textGenerationModel = "openai" | "anthropic" | "mistralai" | "googlegenerativeai" | "meta-llama" | "deepseek-ai" | "qwen";
export type translationModel = "googlecloudtranslate" | "deepl" | "azureai";
export type ModelConfig = { api_key: string; systemPrompt?: string, model: string, category: "General" | "Writing" | "Coding" | "Translation" | "Search" | "Text to Image" | "Text to Video" | "Image to Video"  };
export type OpenAiSpec = { // histories
  role: "user" | "assistant" | "system"
  content: string
};
export type ModelContentType = {
  messages: OpenAiSpec[],
  text?: string // single text input
};


/**
 * Micro function
 */

export type ProcessWithModelAddOn = {
  channel_id?: string;
  fromLang?: SourceLanguageCode | null, 
  targetLang?: TargetLanguageCode | null,
  body?: any,
  req?: Request
}

// handle service types
async function processWithModel(content: ModelContentType, modelId: string, config: ModelConfig, opt?: ProcessWithModelAddOn) {
  // Get the model instance based on the model ID
  const model = getModelInstance(modelId, config);
  if (["General","Writing","Coding"].includes(config.category)){  
    if (!model) {
      throw new Error(`Model ${modelId} is not supported`)
    }
  }

  // Generate text using the AI SDK
  let generatedContent; // "" || {}
  let taskId; // used for heavy process like async image/video generatiom

  console.log("Ctg: ", config.category);
  switch (config.category){
    case "General":
    case "Writing":
    case "Coding":
      console.log("Executing general/writing/coding");
      const resl = (await generateText({
        messages: content.messages,
        // @ts-ignore
        model,
        prompt: content.text,
        // Optional system prompt if provided in config
        ...(config.systemPrompt && { system: config.systemPrompt }),
      }));
      generatedContent = resl.text;
      break;
    
    case "Translation":
      generatedContent = await handleTranslation(content.messages[content.messages.length - 1].content, modelId, {...config, fromLang: opt?.fromLang || null, targetLang: opt?.targetLang || "en-US"});
    break;

    case "Search":
      generatedContent = await handleSearch(content.messages, modelId, config, opt);
    break;

    case "Text to Image":
      const {valid, error} = await inlineValidate(imageGenerationSchema, opt!.body, opt!.req as Request);
      if (!valid) {
        console.error(error);
        createResponse(JSON.stringify(error), 400, error);
      }

      generatedContent = await handleTextToImageGeneration(content.messages, config, opt!.body, model!);
    break;

    case "Text to Video":
    case "Image to Video":
      const {valid: validReqBodyVideo, error: errorReqBodyVideo} = await inlineValidate(reqBodyVideoGenerationSchema, opt!.body, opt!.req as Request);
      if (!validReqBodyVideo) {
        console.error(errorReqBodyVideo);
        createResponse(JSON.stringify(errorReqBodyVideo), 400, errorReqBodyVideo);
      }

      generatedContent = await handleVideoGeneration(content.messages[content.messages.length - 1], config, opt!.body);
    break;

    default:
      return [404, null];
  }

  return [generatedContent, taskId];
}

/**
 * Core Service
 */

// General, write  & code (exclude google codegecko): Process text with a specified AI model
export const processText = async (req: Request, res: Response) => {
  try {
    const { text, ai_model, channel_id } = req.body

    // Validate request
    if (!text || !ai_model || !channel_id) {
      res.status(400).json({ error: "Missing required parameters: text / ai_model / channel_id" })
      return;
    }

    // channel_id must be a valid uuid
    if (!isValidUUID(channel_id)) {
      res.status(400).json({ error: "Invalid channel_id" })
      return;
    }

    // Get API key from database
    const modelConfig = await db.getModelConfig(ai_model, channel_id, {onlyOwnedByUser: req.user.sub})

    if (!modelConfig!.data) {
      res.status(404).json({ error: `AI model "${ai_model}" not found or not configured` })
      return;
    }

    await supabase.from("messages").insert([
			{
				workspace_id: modelConfig!.data.workspace_id,
				user_id: req.user.sub,
				tool_id: modelConfig!.data.id,
				channel_id,
				role: "user",
				content: text,
			},
		]);

    		// Fetch chat history for context
		const { data: chatHistory, error: historyError } = await supabase
      .from("messages")
      .select("role, content")
      .eq("user_id", req.user.sub)
      .eq("tool_id", modelConfig!.data.id)
      .eq("workspace_id", modelConfig!.data.workspace_id)
      .eq("channel_id", channel_id)
      .order("timestamp", { ascending: true });

    if (historyError) {
      console.error("Error fetching chat history:", historyError.message);
    }

    // Format chat history for AI SDK
    let formattedMessages =
    chatHistory && chatHistory.length > 0
      ? chatHistory.map(({ role, content }) => ({ role, content }))
      : [];

    // Ensure at least one message is present
    if (formattedMessages.length === 0) {
      formattedMessages.push({ role: "user", content: text });
    }

    // add system prompts
    formattedMessages.unshift({role: "system", content: modelConfig!.data.systemPrompt});

    // Process text with the appropriate model
    const [result, taskId] = await processWithModel({messages:formattedMessages}, ai_model, modelConfig!.data, {channel_id, body: req.body, fromLang: req.body.from, targetLang: req.body.to, req});

    if (result == 404){
      return createResponse("Service not found", 404);
    }

    console.log({result});

    await supabase.from("messages").insert([
      {
        workspace_id: modelConfig!.data.workspace_id,
        tool_id: modelConfig!.data.id,
        user_id: req.user.sub,
        channel_id,
        role: "assistant",
        content: result,
        task_id: taskId
      },
    ]);

    res.json({ message: result });
    return;
  } catch (error: any) {
    if (!error.isHttpError) console.error("Error processing text:", error)
    res.status(error.status || 500).json({ message: error.message || "Failed to process text" })
    return;
  }
}

// used by ai sdk to get model instance
function getModelInstance(modelName: string, config: { api_key: string }) {
  // Parse the model ID to determine provider and model name
  const [provider, ...modelIdParts] = modelName.split("/")
  const modelId = modelIdParts.join("/")

  // define provider args with custom dynamic api key
  const createProviderArgs = { apiKey: config.api_key };

  // Create model instance based on provider
  switch (provider) {
    case "OpenAi":
      const openai = createOpenAI(createProviderArgs)
      return openai(modelId)
    case "Anthropic":
      const anthropic = createAnthropic(createProviderArgs)
      return anthropic(modelId)
    case "MistralAi":
      return createMistral(createProviderArgs)(modelId)
    case "Google Ai Studio":
      return createGoogleGenerativeAI(createProviderArgs)(modelId)
    case "TogetherAi":
      return createTogetherAI(createProviderArgs)(modelId)
    case "Deepseek Ai":
      const deepseek = createDeepSeek(createProviderArgs)
      return deepseek(modelId)
    case "Qwen":
      const qwen = createQwen(createProviderArgs)
      return qwen(modelId)
    default:
      return null
  }
}

/**
* Translation
*/

export const translateText = async (req: Request, res: Response) => {
  const { text, from, to, ai_model, channel_id } = req.body

  try {
    // Get API key from database
    const modelConfig = await db.getModelConfig(ai_model, channel_id, {onlyOwnedByUser : req.user.sub})
    
    if (!modelConfig!.data) {
      res.status(404).json({ error: `AI model "${ai_model}" not found or not configured` })
      return;
    }
    const result = await processWithModel({messages: [{role: "user", content: text}]}, ai_model, modelConfig!.data, {fromLang: from, targetLang: to});
    
    res.json({ message: result });
    return;
  } catch (error: any) {
    if (!error.isHttpError) console.error("Error processing text:", error)
    res.status(error.status || 500).json({ message: error.message || "Failed to process text" })
    return;
  }
}

