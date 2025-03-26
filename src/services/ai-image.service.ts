import { Request, Response } from "express";
import { handleTextToImageGeneration } from "./text-to-image-sdks.service";

export const processImageGeneration = async (req: Request, res: Response) => {
	const { ai_model, text, channel_id, service } = req.body;

	try {
		// const base64Image = await handleTextToImageGeneration(req.body,);


		// res.json({ image: base64Image });
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
};