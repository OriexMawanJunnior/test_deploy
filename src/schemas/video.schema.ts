import {z} from "zod";

export const reqBodyVideoGenerationSchema = z.object({
  // global
  ai_model: z.string(),
  channel_id: z.string().uuid(),
  text: z.string(),
  duration: z.number(),
  resolution: z.string().optional(),
  aspect_ratio: z.string().optional(),
  image_url: z.string().url().optional(), // supabase url of uploaded images

  // synthesia
  visibility: z.string().optional().default("priate"),

  // heygen
  width: z.number().optional().default(1280),
  height: z.number().optional().default(720),
  avatar_id: z.string().optional(),
  avatar_style: z.string().optional().default("normal"),
  voice_speed: z.number().optional().default(1.1),
  voice_id: z.string().optional(),
});

export type ReqBodyVideoGeneration = z.infer<typeof reqBodyVideoGenerationSchema>