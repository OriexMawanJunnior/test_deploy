import { z } from "zod";

export const imageGenerationSchema = z.object({
  channel_id: z.string().uuid(),
  ai_model: z.string(),
  text: z.string({
    required_error: "Prompt is required",
  }).min(1, "Prompt cannot be empty"),

  // stability
  negative_prompt: z.string().optional(), // leo
  aspect_ratio: z.enum(["1:1", "16:9", "4:3"]).optional().default("1:1"),
  seed: z.number().int().nonnegative().optional().default(0), // bfl, leo
  output_format: z.enum(["jpeg", "png", "webp"]).optional().default("jpeg"), // bfl
  style_preset: z.enum([
    "3d-model", "analog-film", "anime", "cinematic", "comic-book", 
    "digital-art", "enhance", "fantasy-art", "isometric", "line-art", 
    "low-poly", "modeling-compound", "neon-punk", "origami", 
    "photographic", "pixel-art", "tile-texture"
  ]).optional(),

  // dall e props
  quality: z.enum(["standard","hd"]).optional().default("standard"),
  n: z.number().optional().default(1), // leo
  size: z.enum(["1024x1024","256x256","512x512","1792x1024","1024x1792"]).optional().default("1024x1024"),

  // Blackforest labs
  width: z.number().min(256).max(1440).optional().default(1024), // leo
  height: z.number().min(256).max(1440).optional().default(786), // leo

  // leonardo
  alchemy: z.boolean().optional().default(true),
  contrast_ratio: z.number().min(0).max(1).optional(),
  contrast: z.number().min(1).max(4.5).optional(),
  fantasy_avatar: z.boolean().optional(),
  guidance_scale: z.number().min(1).max(20).optional(),
  photo_real: z.boolean().optional(),
  leo_preset_style: z.enum([
    "LEONARDO", "NONE", "ANIME", "CREATIVE", "DYNAMIC", 
    "ENVIRONMENT", "GENERAL", "ILLUSTRATION", "PHOTOGRAPHY", 
    "RAYTRACED", "RENDER_3D", "SKETCH_BW", "SKETCH_COLOR"
  ]).optional().default("DYNAMIC"),

  // firefly
  content_class: z.enum(["photo","art"]).optional(),
}); 

export type ImageGenerationSchema = z.infer<typeof imageGenerationSchema>;