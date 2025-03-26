import { Request, Response } from "express";
import { OpenAI } from "openai";
import { supabase } from "../lib/supabaseClient";

export const getAvailableApiKeys = async (req: Request, res: Response) => {
    const { workspace_id } = req.query;

    if (!workspace_id) {
        res.status(400).json({ error: "Workspace ID is required" });
        return;
    }

    const { data, error } = await supabase
        .from("api_keys")
        .select("id, api_key, provider")
        .eq("workspace_id", workspace_id);

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    res.json({ apiKeys: data });
};

export const selectApiKey = async (req: Request, res: Response) => {
    const { workspace_id, api_key } = req.body;

    if (!workspace_id || !api_key) {
        res.status(400).json({ error: "Workspace ID and API Key ID are required" });
        return;
    }

    const { error } = await supabase
        .from("workspaces")
        .update({ selected_api_key: api_key })
        .eq("id", workspace_id);

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    res.json({ message: "API Key updated successfully" });
};

export const handleChat = async (req: Request, res: Response) => {
    const { question, categoryId, workspace_id } = req.body;

    if (!question) res.status(400).json({ error: "Question is required" });

    // Cek API Key yang sedang dipilih oleh workspace
    const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .select("selected_api_key")
        .eq("id", workspace_id)
        .single();

    if (workspaceError || !workspaceData?.selected_api_key) {
        res.status(400).json({ error: "No API key selected for this workspace" });
        return;
    }

    const openai = new OpenAI({ apiKey: workspaceData.selected_api_key });

    // Lanjutkan ke proses chat dengan API Key yang dipilih
    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: question,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const { data: chunks, error } = await supabase.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 3,
        category_id: categoryId,
    });

    if (error) res.status(500).json({ error: error.message });

    let documentContent = chunks?.map((chunk: any) => chunk.content).join("\n");

    if (!documentContent || documentContent.trim() === "") {
        res.json({ answer: "Maaf, saya tidak dapat menemukan informasi yang relevan dalam database kami." });
        return;
    }

    const chatResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "You are a helpful company helpdesk assistant." },
            { role: "user", content: `Pertanyaan: ${question}\n\nInformasi relevan:\n${documentContent}\n\nJawaban:` },
        ],
    });

    res.json({ answer: chatResponse.choices[0].message.content });
};

