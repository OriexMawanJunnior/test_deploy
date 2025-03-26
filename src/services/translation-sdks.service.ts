/**
 * Manage translation api calls from various providers
 */

import { v2 as GCTranslationV2 , v3 as GCTranslationV3} from "@google-cloud/translate"
import { ModelConfig } from "./ai-text.service";
import { SourceLanguageCode, TargetLanguageCode, Translator } from "deepl-node";
import createClient from "@azure-rest/ai-translation-text";
import { googleTranslate } from "../lib/google-api.lib";


export async function handleTranslation(text: string, modelName: string, config: ModelConfig & { fromLang: SourceLanguageCode | null, targetLang: TargetLanguageCode, providerUrl?: string }) {
  const { api_key, systemPrompt, model, fromLang, targetLang, providerUrl } = config;
  const [provider, ...modelIdParts] = modelName.split("/")
  const modelId = modelIdParts.join("/")

  switch (provider) {
    case "Google Cloud":
      // return await new GCTranslationV3.TranslationServiceClient({apiKey: api_key}).translateText({contents: [text], targetLanguageCode: targetLang})
      return await googleTranslate({text, config});
    case "DeepL":
      return (await new Translator(api_key).translateText(text, fromLang, targetLang)).text;
    case "AzureAi":
      const endpoint = providerUrl || "https://api.cognitive.microsofttranslator.com/";
      const client = createClient(endpoint, { key: api_key });
      const result = await client.path("/translate").post({body: [{text}], queryParameters: {from: fromLang as string, to: targetLang}});
      // @ts-ignore
      return result.body[0].translations[0].text;
    default:
      return null;
  }
}
