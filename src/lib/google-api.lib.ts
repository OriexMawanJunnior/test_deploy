import { SourceLanguageCode, TargetLanguageCode } from "deepl-node";
import { ModelConfig } from "../services/ai-text.service";
import { GoogleAuth } from 'google-auth-library';

export async function googleTranslate(opt: {text: string;config: ModelConfig & { fromLang: SourceLanguageCode | null, targetLang: TargetLanguageCode }}) {
  const [PROJECT_ID, LOCATION, APIKEY] = opt.config.api_key.split(':');

  const reqBody = opt.config.model == 'translation-llm' ? { // translation llm
    "instances": [{
      "source_language_code": opt.config.fromLang,
      "target_language_code": opt.config.targetLang,
      "contents": [opt.text],
      "mimeType": "text/plain",
      "model": `projects/${PROJECT_ID}/locations/${LOCATION}/models/general/translation-llm`
    }]
  } : opt.config.model == "gemini-1.0-pro-002" ? { // gemini model
    "contents": [
      {
        "role": "user",
        "parts": [
          {
          "text": `${opt.config.fromLang}: ${opt.text}\n${opt.config.targetLang}:`
          }
        ]
      }
    ],
    // "generation_config": {
    //   "temperature": TEMPERATURE,
    //   "topP": TOP_P,
    //   "topK": TOP_K,
    //   "candidateCount": 1,
    //   "maxOutputTokens": MAX_OUTPUT_TOKENS
    // }
    // "safetySettings": [
    //   {
    //     "category": "SAFETY_CATEGORY",
    //     "threshold": "THRESHOLD"
    //   }
    // ]
  } : { // NMT mdodel
    "sourceLanguageCode": opt.config.fromLang,
    "targetLanguageCode": opt.config.targetLang,
    "contents": [opt.text]
  };

  // const auth = new GoogleAuth({
  //   scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  //   apiKey: APIKEY
  //   // If running locally, this will use the application default credentials
  //   // If running on GCP, this will use the service account credentials
  // });

  // Get an access token
  // const client = await auth.getClient();
  // const token = await client.getAccessToken();

  console.log(reqBody)

  return await fetch(`${["translation-llm","gemini-1.0-pro-002"].includes(opt.config.model) ? `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/` : `https://translation.googleapis.com/v3/projects/`}${opt.config.model == 'translation-llm' ? 'cloud-translate-text:predict' : opt.config.model == 'gemini-1.0-pro-002' ? `${opt.config.model}:streamGenerateContent` : `${PROJECT_ID}:translateText`}`, {
    method: "POST",
    headers: {
      Authorization: "Bearer "+APIKEY,
    },
    body: JSON.stringify(reqBody)
  }).then(resp => resp.json());
}

export async function googleCodeCompletion(opt: {text: string;config: ModelConfig}){
  const [PROJECT_ID, LOCATION, APIKEY] = opt.config.api_key.split(':');
  return await fetch(`https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/code-gecko:predict`, {
    method: "POST",
    headers: {
      Authorization: "Bearer "+APIKEY,
    },
    body: JSON.stringify({
      "instances": [
        { 
          "prefix": opt.text,
          "suffix": ""
        }
      ],
      "parameters": {
        "temperature": 0.2,
        "maxOutputTokens": 64,
        "candidateCount": 1
      }
    })
  }).then(resp => resp.json());
}