import { ChatCompletionMessageParam } from "openai/resources";
import { ModelConfig, OpenAiSpec, ProcessWithModelAddOn } from "./ai-text.service";
import OpenAI from "openai";

export type SearchResponseType = {
  message: string;
  search_results: {
    url: string;
    name: string;
    snippet: string;
  }[]
}

// response api can be fdifferent 
export async function handleSearch(prompts: ChatCompletionMessageParam[], modelName: string, config: ModelConfig, opt?: ProcessWithModelAddOn): Promise<SearchResponseType | null> {
  const [provider, ...modelIdParts] = modelName.split("/")
  const modelId = modelIdParts.join("/")

  let completion;
  switch (provider) {
    
    // openapi specs
    case "PerplexityAi":
      const prv = new OpenAI({baseURL: "https://api.perplexity.ai", apiKey: config.api_key});
      const prerpResp = await prv.chat.completions.create({
        model: config.model,
        messages: prompts
      }) as OpenAI.Chat.Completions.ChatCompletion & {citations: string[]};
      completion = {
        message: prerpResp.choices[0].message.content,
        search_results: prerpResp.citations.map((citation) => ({
          url: citation,
          name: null,
          snippet: null
        }))
      }
    break;

    case "You.com":
      completion = await fetch('https://chat-api.you.com/smart', {
        method: 'POST',
        headers: {'X-API-Key': config.api_key, 'Content-Type': 'application/json'},
        body: JSON.stringify({
          "query": prompts,
          "chat_id": opt?.channel_id, // use ch id as session id
          "instructions": config.systemPrompt
        })
      }).then(response => response.json());
    break;

    case "Exa Ai":
      const respExa = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          Authorization: "Bearer "+config.api_key
        }
      }).then(resp => resp.json());
      completion = {
        message: respExa.message,
        search_results: respExa.results.map((result: any) => ({
          name: result.title,
          snippet: respExa.summary,
          ...result
        })),
        searchType: respExa.searchType,
        resolvedSearchType: respExa.resolvedSearchType,
      };
    break;
    default:
      completion = null
  }
  return completion;
}

