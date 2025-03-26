import express, { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { experimental_generateImage as generateImage, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createFireworks } from '@ai-sdk/fireworks';
import { generateStabilityImage } from "../lib/image-generation-api.lib";

const router = express.Router();

// Gemini API Endpoint
router.post("/gemini", async (req: Request, res: Response) => {
	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
	const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

	const prompt = "Explain how AI works";

	try {
		const result = await model.generateContent(prompt);
		console.log(result.response.text());
		res.send(result.response.text());
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

router.post("/gemini/aisdk", async (req: Request, res: Response) => {
	const { prompt } = req.body;
	try {
		const provider = createGoogleGenerativeAI({
			apiKey: process.env.GEMINI_API_KEY
		});

		const model = provider("gemini-1.5-flash-latest");

		// Generate text using the AI SDK
		const { text: generatedText } = await generateText({
			model,
			prompt,
		});

		res.send({ text: generatedText });
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

// test image generation
router.post("/fw/image", async (req: Request, res: Response) => {
	const { prompt } = req.body;
	try {
		const fireworks = createFireworks({
			apiKey: process.env.FIREWORKS_API_KEY ?? '',
		});

		const { image } = await generateImage({
			model: fireworks.image('accounts/fireworks/models/firefunction-v1'),
			prompt,
			aspectRatio: '1:1',
		});

		res.send({ image });
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

// test image generation with stability ai
router.post("/stability/image", async (req: Request, res: Response) => {
	const { prompt } = req.body;

	try {
		// const base64Image = await generateStabilityImage('sd3', {}, {
		// 	prompt,
		// 	negative_prompt: "",
		// 	aspect_ratio: "1:1",
		// 	seed: 0,
		// 	output_format: "jpeg",
		// 	model: "sd3.5-large",
		// 	mode: "text-to-image",
		// });

		// res.json({ image: base64Image });
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

export default router;
