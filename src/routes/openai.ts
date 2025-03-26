import express, { Request, Response } from "express";
import OpenAI from "openai";
import * as dotenv from "dotenv"; // Modern import
import { supabase } from "../lib/supabaseClient";
dotenv.config();

const router = express.Router();

router.post("/gpt", async (req: Request, res: Response) => {
	const { workspace_id, user_id, tool_id, channel_id, content } = req.body;
	console.log(req.body);

	try {
		// Fetch tool details from the database
		const { data: tools, error } = await supabase
			.from("channel_tools")
			.select("*")
			.eq("id", tool_id)
			.single();

		if (error) {
			throw new Error(`Error fetching tools: ${error.message}`);
		}

		if (!tools) {
			throw new Error("Tool not found");
		}

		console.log(tools);

		const openai = new OpenAI({
			apiKey: tools.api_key,
		});

		// Save user message to the database
		await supabase.from("messages").insert([
			{
				workspace_id,
				user_id,
				tool_id,
				channel_id,
				role: "user",
				content,
			},
		]);

		// Fetch chat history for context
		const { data: chatHistory, error: historyError } = await supabase
			.from("messages")
			.select("role, content")
			.eq("user_id", user_id)
			.eq("tool_id", tool_id)
			.eq("workspace_id", workspace_id)
			.eq("channel_id", channel_id)
			.order("timestamp", { ascending: true });

		if (historyError) {
			console.error("Error fetching chat history:", historyError.message);
		}

		// Format chat history for OpenAI API
		let formattedMessages =
			chatHistory && chatHistory.length > 0
				? chatHistory.map(({ role, content }) => ({ role, content }))
				: [];

		// Ensure at least one message is present
		if (formattedMessages.length === 0) {
			formattedMessages.push({ role: "user", content });
		}

		console.log(formattedMessages);

		// Get AI response
		const completion = await openai.chat.completions.create({
			messages: formattedMessages,
			model: "gpt-4o-mini",
		});

		const botMessage =
			completion.choices[0]?.message?.content ?? "No response from AI.";

		// Save AI response to the database
		await supabase.from("messages").insert([
			{
				workspace_id,
				tool_id,
				user_id,
				channel_id,
				role: "assistant",
				content: botMessage,
			},
		]);

		// Send response back to client
		res.json({ message: botMessage });
	} catch (error) {
		console.error("Error:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

export default router;
