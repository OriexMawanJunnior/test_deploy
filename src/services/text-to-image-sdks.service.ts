import { LanguageModelV1 } from "ai";
import { generateDallEImage, generateDeepAIImage, generateFluxBFLImage, generateLeonardoImage, generateStabilityImage, generateGenerativeImage } from "../lib/image-generation-api.lib";
import { ImageGenerationSchema, imageGenerationSchema } from "../schemas/image.schema";
import { ModelConfig, OpenAiSpec } from "./ai-text.service";
import {z} from "zod";

export async function handleTextToImageGeneration(messages: OpenAiSpec[], config: ModelConfig, body: ImageGenerationSchema, model?: LanguageModelV1) {
  const [provider, ...modelIdParts] = body.ai_model.split("/")
  const modelId = modelIdParts.join("/")

  switch (provider) {
    case "StabilityAi":
      console.log("stability generation")
      return await generateStabilityImage(config, body);
    case "OpenAi":
      return await generateDallEImage(config, body);
    case "BlackForest Labs":
      return await generateFluxBFLImage(config, body);
    case "LeonardoAi":
      return await generateLeonardoImage(config, body);
    // case "Adobe Firefly":
    //   return await generateAdobeFireflyImage(config, body);
    case "DeepAi":
      return await generateDeepAIImage(config, body);
    case "Google Ai Studio":
      return await generateGenerativeImage(config, body, model!);
    default: 
      return null
  }
}

