import OpenAI from "openai";
import RunwayML from '@runwayml/sdk';
import { ModelConfig } from "../services/ai-text.service";
import {z} from "zod";
import { ImageGenerationSchema } from "../schemas/image.schema";

import {v4 as uuidv4} from "uuid";
import { uploadMediaToSupabase } from "./supabase.lib";
import { createResponse } from "../helpers/response.helper";
import { supabase } from "./supabaseClient";
import { GoogleAuth } from 'google-auth-library';
import { generateText, LanguageModelV1 } from "ai";
import { google } from "@ai-sdk/google";

// const client = new RunwayML();

export type ReqBodyWhenUseStabilityAi = {
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  seed?: number;
  output_format?: string;
  model?: string;
  mode?: string;
}

export type ReqBodyFluxBFL = {
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  seed?: number;
  output_format?: string;
  model?: string;
  mode?: string;
}

export type ReqBodyLeonardo = {
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  seed?: number;
  output_format?: string;
  model?: string;
  mode?: string;
}

export type ReqBodyDallE = {
  prompt: string;
}

export type ReqBodyAdobeFirefly = {
  prompt: string;
  numVariations?: number;
  seeds?: number[];
  size?: {
    width: number;
    height: number;
  };
  negativePrompt?: string;
  contentClass?: string;
  visualIntensity?: number;
  style?: {
    presets?: string[];
    strength?: number;
    imageReference?: {
      source: {
        url: string;
        uploadId: string;
      }
    }
  };
  promptBiasingLocaleCode?: string;
  tileable?: boolean;
  structure?: {
    strength: number;
    imageReference: {
      source: {
        url: string;
        uploadId: string;
      }
    }
  };
}

export type ReqBodyDeepAI = {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
}

export type ReqBodyVertexAi = {
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  seed?: number;
}

/**
 * Fetches an image from a URL and converts it to a base64 string
 * @param {string} imageUrl - The URL of the image to fetch
 * @param {boolean} includeDataUri - Whether to include the data URI prefix (default: true)
 * @returns {Promise<string>} - A promise that resolves to the base64 string
 */
async function imageUrlToBase64(imageUrl: string, includeDataUri = true) {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Get the content type from the headers
    const contentType = response.headers.get('content-type');
    
    // Convert the image to a buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Convert the buffer to a base64 string
    const base64String = Buffer.from(imageBuffer).toString('base64');
    
    // Return the base64 string with or without the data URI prefix
    if (includeDataUri) {
      return `data:${contentType};base64,${base64String}`;
    } else {
      return base64String;
    }
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

export const generateStabilityImage = async (config: ModelConfig, body: ImageGenerationSchema) => {
  const data = new FormData();
  data.append("prompt", body.text);
  if (body.negative_prompt) data.append("negative_prompt", body.negative_prompt);
  data.append("aspect_ratio", body.aspect_ratio || "1:1");
  data.append("seed", String(body.seed ?? 0));
  data.append("output_format", body.output_format ?? "jpeg");
  data.append("model", config.model ?? "sd3.5-medium");
  data.append("mode", "text-to-image");
  if (body.style_preset) data.append("style_preset", body.style_preset);

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/"+(config.model.includes("sd3") ? "sd3" : config.model.includes("ultra") ? "ultra" : "core"),
    {
      method: "POST",
      headers: {
        // "Content-Type": "multipart/form-data",
        Accept: "image/*",
        Authorization: `Bearer ${config.api_key}`,
      },
      body: data
    }
  );

  if (!response.ok) {
    throw new Error(`Stability API error: ${await response.text()}`);
  }

  const imageData = await response.blob(); // Assuming response is the image response

  const fileName = `${config.model}-${body.text.slice(0, 30).split(" ").join("-")}-${Date.now()}-${await uuidv4()}.${response.headers.get("content-type")?.split("/")[1] || "png"}`; // Generate a unique file name
  const imageUrl = await uploadMediaToSupabase(imageData, {fileName, mimeType: response.headers.get("content-type") || "image/png"});

  return imageUrl;
}

export function convertB64ToFile(base64: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: 'image/jpeg' }); // Adjust MIME type as necessary
}

export const generateDallEImage = async (config: ModelConfig, body: ImageGenerationSchema) => {
  const openai = new OpenAI({
    apiKey: config.api_key,
  });
  const response = await openai.images.generate({
    prompt: body.text,
    model: config.model,
    quality: body.quality || "standard",
    n: body.n,
    size: body.size,
    response_format: "b64_json",
  });
  const base64Image = response.data[0].b64_json;

  if (!base64Image) return createResponse(JSON.stringify(response), 500);

  const fileName = `${config.model}-${body.text.slice(0, 30).split(" ").join("-")}-${Date.now()}-${await uuidv4()}.png`; // Generate a unique file name
  const imageUrl = await uploadMediaToSupabase(convertB64ToFile(base64Image), {fileName, mimeType: "image/png"});

  return imageUrl;
}

export const generateFluxBFLImage = async (config: ModelConfig, body: ImageGenerationSchema): Promise<string> => {
  const response = await fetch(
    "https://api.us1.bfl.ai/v1/"+config.model,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-key": config.api_key,
      },
      body: JSON.stringify({
        prompt: body.text,
        width: body.width,
        height: body.height,
        seed: body.seed
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Flux API error: ${response.statusText}`);
  }

  const result = await response.json();

  console.log({result});
  let taskResult;
  do {
    // Wait for ten seconds before polling
    await new Promise(resolve => setTimeout(resolve, 10000));

    taskResult = await fetch("https://api.us1.bfl.ai/v1/get_result?id="+result.id, {
      headers: {
        Accept: "application/json"
      }
    }).then(resp => resp.json());
  } while (!['Task not found','Request Moderated','Content Moderated','Ready','Error'].includes(taskResult.status));

  console.log({taskResult});
  return taskResult.result.sample;
}

export const generateLeonardoImage = async (config: ModelConfig, body: ImageGenerationSchema): Promise<string[]> => {
  const reqbody = {
    "alchemy": body.alchemy,
    "height": body.height,
    "modelId": (await supabase.from("models").select("specified_model_id").eq("name", config.model).single().then(({data}) => data?.specified_model_id)),
    "num_images": body.n,
    "presetStyle": body.leo_preset_style,
    "prompt": body.text,
    "width": body.width,
    contrastRatio: body.contrast_ratio,
    contrast: body.contrast,
    fantasyAvatar: body.fantasy_avatar,
    guidance_scale: body.guidance_scale,
    photoReal: body.photo_real
  };

  console.log(reqbody);

  const response = await fetch(
    "https://cloud.leonardo.ai/api/rest/v1/generations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.api_key}`,
      },
      body: JSON.stringify(reqbody)
    }
  );

  if (!response.ok) {     
    throw new Error(`Leonardo API error: ${response.statusText}`);
  }

  const result = await response.json();
  const taskId = result.sdGenerationJob.generationId as string;

  let taskResult;
  do {
    // Wait for ten seconds before polling
    await new Promise(resolve => setTimeout(resolve, 10000));

    taskResult = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations/"+taskId, {
      headers: {
        Accept: "application/json"
      }
    }).then(resp => resp.json());
  } while (!['COMPLETE','COMPLETED','FAILED'].includes(taskResult.status));

  return taskResult.generated_images.map((x: any) => x.url);
}

async function retriveFireflyAccessToken(secretKey: string): Promise<string>{
  const [clientId, clientSecret] = secretKey.split(':');
  const response = await fetch(
    "https://ims-na1.adobelogin.com/ims/token/v3",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'firefly_api,ff_apis',
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Adobe Firefly Retrive Access Token API error: ${response.statusText}`);
  }

  const result = await response.json();  
  return result.access_token;
}

// removed
// export const generateAdobeFireflyImage = async (config: ModelConfig, body: ImageGenerationSchema): Promise<string> => {
//   const fireflyAccessToken = await retriveFireflyAccessToken(config.api_key);
//   const response = await fetch(
//     "https://firefly-api.adobe.io/v3/images/generate",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-key": config.api_key.split(":")[0],
//         "Authorization": `Bearer ${fireflyAccessToken}`,
//       },
//       body: JSON.stringify({
//         prompt: body.text,        
//         "numVariations": body.n,
//         "seeds": [
//         body.seed
//         ],
//         "size": {
//         "width": body.width,
//         "height": body.height
//         },
//         "negativePrompt": body.negative_prompt,
//         contentClass: body.content_class
//       })
//     }
//   );

//   if (!response.ok) {
//     throw new Error(`Adobe Firefly API error: ${response.statusText}`);
//   }

//   const result = await response.json();

//   console.log(result);

//   const base64Image = await imageUrlToBase64(result.outputs[0].image.url);
//   const fileName = `${config.model}-${body.text.slice(0, 30).split(" ").join("-")}-${Date.now()}-${await uuidv4()}.png`; // Generate a unique file name
//   const imageUrl = await uploadMediaToSupabase(convertB64ToFile(base64Image), {fileName, mimeType: "image/png"});

//   return imageUrl;
// }

export const generateDeepAIImage = async (config: ModelConfig, body: ImageGenerationSchema): Promise<string> => {
  // Create form data for the request
  const formData = new FormData();
  formData.append('text', body.text);
  
  // Make the API request
  const response = await fetch('https://api.deepai.org/api/text2img', {
    method: 'POST',
    headers: {
      'api-key': config.api_key,
    },
    body: formData,
  });
      
  if (!response.ok) {
    throw new Error(`DeepAI API error: ${response.statusText}`);
  }

  const result = await response.json();

  console.log(result);

  // The API returns a URL to the generated image, so we need to fetch it
  if (!result.output_url) {
    throw new Error('No output URL in the DeepAI response');
  }

  const base64Image = await imageUrlToBase64(result.output_url);
  const fileName = `${config.model}-${body.text.slice(0, 30).split(" ").join("-")}-${Date.now()}-${await uuidv4()}.png`; // Generate a unique file name
  const imageUrl = await uploadMediaToSupabase(convertB64ToFile(base64Image), {fileName, mimeType: "image/png"});

  return imageUrl;
}

export const generateGenerativeImage = async (config: ModelConfig, body: ImageGenerationSchema, model: LanguageModelV1): Promise<string> => {
  // const [LOCATION, PROJECT_ID, API_KEY] = config.api_key.split(":");
  console.log(body);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${config.api_key}`, {
    method: "POST",
    body: JSON.stringify({
      "instances": [
        {
          "prompt": body.text
        }
      ],
      "parameters": {
        "sampleCount": body.n || 1
      }
    })
  });

  if (!response.ok) {     
    throw new Error(`Google API error: ${response.statusText}`);
  }
  
  const result = await response.json();
  // @ts-ignore
  console.log(result);

  // const base64Image = result.files;

  // const fileName = `${config.model}-${body.text.slice(0, 30).split(" ").join("-")}-${Date.now()}-${await uuidv4()}.png`; // Generate a unique file name
  // const imageUrl = await uploadMediaToSupabase(convertB64ToFile(base64Image), {fileName, mimeType: "image/png"});
  // return imageUrl;
  return "";
}