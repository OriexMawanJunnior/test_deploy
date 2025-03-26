import { z } from "zod";
export const textSchema = z.object({
  text: z.string(),
  ai_model: z.string(), 
  channel_id: z.string().uuid()
})