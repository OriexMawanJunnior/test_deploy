import { ReqBodyVideoGeneration } from "../schemas/video.schema";
import { ModelConfig } from "../services/ai-text.service";
import RunwayML from '@runwayml/sdk';
import { downloadAndSaveVideoUrls, downloadFileBuffer, uploadMediaToSupabase } from "./supabase.lib";
import {v4 as uuidv4} from "uuid";
import { fal } from "@fal-ai/client";

/** Text To video with Image To Video (receiver img refference in req body) */

// export const generateSoraVideo = async (config: ModelConfig, body: ReqBodyVideoGeneration) => {
//   // Implementation for Sora video generation
//   const response = await fetch("https://api.sora.video/v1/videos", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${config.api_key}`
//     },
//     body: JSON.stringify({
//       prompt: body.text,
//       style: "natural",
//       duration: 10,
//       resolution: "1080p",
//       output_format: "mp4"
//     })
//   });

//   const data = await response.json();
//   return data;
// };

// export const generateRunwayVideo = async (config: ModelConfig, body: ReqBodyVideoGeneration) => {
//   // Implementation for Runway ML video generation
//   const response = await fetch("https://api.runwayml.com/v1/videos", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${config.api_key}`
//     },
//     body: JSON.stringify({
//       prompt: body.text,
//       style: "natural",
//       duration: 10,
//       resolution: "1080p",
//       output_format: "mp4"
//     })
//   });
//   const data = await response.json();
//   return data;
// };

// export const generatePikaVideo = async (config: ModelConfig, body: ReqBodyVideoGeneration) => {
//   // Implementation for Pika Labs video generation
//   const response = await fetch("https://api.pikalabs.com/v1/videos", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${config.api_key}`
//     },
//     body: JSON.stringify({
//       prompt: body.text,
//       style: "natural",
//       duration: 10,
//       resolution: "1080p",
//       output_format: "mp4"
//     })
//   });
//   const data = await response.json();
//   return data;
// };

export const generateRunwayMLVideo = async (config: ModelConfig, body: ReqBodyVideoGeneration): Promise<string[]> => {
  const client = new RunwayML({apiKey: config.api_key});

  const task = await client.imageToVideo.create({
    model: config.model as "gen3a_turbo",
    promptImage: body.image_url!,
    promptText: body.text
  });

  let taskResult;
  do {
    // Wait for ten seconds before polling
    await new Promise(resolve => setTimeout(resolve, 10000));

    taskResult = await client.tasks.retrieve(task.id);
  } while (!['SUCCEEDED', 'FAILED'].includes(taskResult.status));

  const videoUrls = await downloadAndSaveVideoUrls(taskResult.output as string[], {text: body.text, model: config.model});
  return videoUrls;
}

export const generateSynthesiaVideo = async (config: ModelConfig, body: ReqBodyVideoGeneration): Promise<string[]> => {
  // Implementation for Synthesia video generation
  const response = await fetch("https://api.synthesia.io/v1/videos", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.api_key}`
    },
    body: JSON.stringify({
      "test": process.env.NODE_ENV !== 'production',
      "title": body.text,
      "visibility": body.visibility,
      "aspectRatio": body.aspect_ratio || "16:9"
    })
  });
  const data = await response.json();

  let taskResult;
  do {
    // Wait for ten seconds before polling
    await new Promise(resolve => setTimeout(resolve, 10000));

    taskResult = await fetch("https://api.synthesia.io/v2/videos/"+data.id, {
      headers: {
        Accept: "application/json",
        "Authorization": `Bearer ${config.api_key}`
      }
    }).then(resp => resp.json());
  } while (!['completed', 'failed'].includes(taskResult.status));

  const videoUrls = await downloadAndSaveVideoUrls([taskResult.download], {text: body.text, model: config.model});
  return videoUrls;
};

// avatar, need api key
// export const generateDeepBrainVideo = async (config: ModelConfig, body: ReqBodyVideoGeneration) => {
//   // Implementation for DeepBrain AI video generation
//   const response = await fetch("https://v2.aistudios.com", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `${config.api_key}`
//     },
//     body: JSON.stringify({
//       scenes: [
//         {
//           AIModel: {
//             "script": body.text,
//             "model": config.model,
//             "clothes": "BG00006160",
//             "locationX": -0.28,
//             "locationY": 0.19,
//             "scale": 1
//           }
//         }
//       ]
//     })
//   });
//   const data = await response.json();

//   let taskResult;
//   do {
//     // Wait for ten seconds before polling
//     await new Promise(resolve => setTimeout(resolve, 10000));

//     taskResult = await fetch("https://api.synthesia.io/v2/videos/"+data.id, {
//       headers: {
//         Accept: "application/json",
//         "Authorization": `${config.api_key}`
//       }
//     }).then(resp => resp.json());
//   } while (!['completed', 'failed'].includes(taskResult.progress));

//   const videoUrls = await downloadAndSaveVideoUrls([taskResult.videourl], {text: body.text, model: config.model});
//   return videoUrls;  
// };

// avatar video generation
export const generateHeyGenVideo = async (config: ModelConfig, body: ReqBodyVideoGeneration) => {
  // Implementation for HeyGen video generation
  const response = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Api-Key": `${config.api_key}`
    },
    body: JSON.stringify({
      "video_inputs": [
        {
          "character": {
            "type": "avatar",
            "avatar_id": body.avatar_id,
            "avatar_style": body.avatar_style
          },
          "voice": {
            "type": "text",
            "input_text": body.text,
            "voice_id": body.voice_id,
            "speed": body.voice_speed
          }
        }
      ],
      "dimension": {
        "width": body.width,
        "height": body.height
      }
    })
  });
  const resb = await response.json();
  
  let taskResult;
  do {
    // Wait for ten seconds before polling
    await new Promise(resolve => setTimeout(resolve, 10000));

    taskResult = await fetch("https://api.heygen.com/v1/video_status.get?video_id="+resb.data.video_id, {
      headers: {
        Accept: "application/json",
        "X-Api-Key": `${config.api_key}`
      }
    }).then(resp => resp.json());
  } while (!['completed', 'failed'].includes(taskResult.status));

  const videoUrls = await downloadAndSaveVideoUrls([taskResult.videourl], {text: body.text, model: config.model});
  return videoUrls;  
};

export const generateFalAi = async (config: ModelConfig, body:ReqBodyVideoGeneration) => {
  fal.config({
    credentials: config.api_key
  });

  const result = await fal.subscribe(`${config.model}/image-to-video`, {
    input: {
      prompt: body.text,
      image_url: body.image_url,
    },
    logs: process.env.NODE_ENV != 'production',
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });

  let taskResult;
  do {
    // Wait for ten seconds before polling
    await new Promise(resolve => setTimeout(resolve, 10000));

    taskResult = await fal.queue.result(`${config.model}/image-to-video`, {
      requestId: result.requestId,
    });

    console.log(taskResult);
    
    // @ts-ignore
  } while (!['COMPLETED', 'FAILED'].includes(taskResult.status));

  // const videoUrls = await downloadAndSaveVideoUrls([taskResult.videourl], {text: body.text, model: config.model});
  // return videoUrls;  
}

// export const generateWanAIVideo = async (config: ModelConfig, body: ReqBodyVideoGeneration) => {
//   // Implementation for Wan AI video generation
//   const response = await fetch("https://api.wanai.ai/v1/videos", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${config.api_key}`
//     },
//     body: JSON.stringify({
//       prompt: body.text,
//       style: "natural",
//       duration: 10,
//       resolution: "1080p",
//       output_format: "mp4"
//     })
//   });
//   const data = await response.json();
//   return data;
// };
