import { z } from "zod";
export const translationSchema = z.object({
  text: z.string(),
  from: z.string(), 
  to: z.string(),
  ai_model: z.string(), 
  channel_id: z.string().uuid()
})