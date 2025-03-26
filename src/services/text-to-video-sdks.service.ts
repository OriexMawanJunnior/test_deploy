import { generateFalAi, generateHeyGenVideo, generateRunwayMLVideo, generateSynthesiaVideo } from "../lib/video-generation-api.lib";
import { ReqBodyVideoGeneration } from "../schemas/video.schema";
import { ModelConfig, OpenAiSpec } from "./ai-text.service";

export const handleVideoGeneration = async (messages: OpenAiSpec, config: ModelConfig, body: ReqBodyVideoGeneration) => {
  const [provider, ...modelIdParts] = body.ai_model.split("/")
  const modelId = modelIdParts.join("/")
  
  switch (provider) {
    // case "sora":
    //   return await generateSoraVideo(config, body);
    case "RunwayML": // image to video
      return await generateRunwayMLVideo(config, body);
    // case "pikalabs":
    //   return await generatePikaVideo(config, body);
    case "Synthesia":
      return await generateSynthesiaVideo(config, body);
    // case "deepbrain":
    //   return await generateDeepBrainVideo(config, body);
    case "HeyGen": // avatar to video
      return await generateHeyGenVideo(config, body);
    // case "wanai":
    //   return await generateWanAIVideo(config, body);
    case "FallAi":
      return await generateFalAi(config, body);
    default:
      return null;
  }
}
