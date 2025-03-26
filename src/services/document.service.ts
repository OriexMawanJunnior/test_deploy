import { Request, Response } from "express";
import { OpenAI } from "openai";
import { supabase } from "../lib/supabaseClient";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getLatestDocument = async (req: any, res: any) => {
    const { categoryId } = req.params;

    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("category_id", categoryId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
};

export const getDocumentVersions = async (req: any, res: any) => {
    const { categoryId } = req.params;

    const { data, error } = await supabase
        .from("documents")
        .select("id, version, created_at")
        .eq("category_id", categoryId)
        .order("version", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
};

export const addNewDocument = async (req: any, res: any) => {
    console.log("Received request:", req.params, req.body);
    const { categoryId } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: "Document content is required" });

    const { data: latestDoc, error: versionError } = await supabase
        .from("documents")
        .select("version")
        .eq("category_id", categoryId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

    if (versionError && versionError.code !== "PGRST116") return res.status(500).json({ error: versionError.message });

    const newVersion = latestDoc ? latestDoc.version + 1 : 1;

    const { data: newDoc, error: insertError } = await supabase
        .from("documents")
        .insert([{ category_id: categoryId, version: newVersion, content }])
        .select()
        .single();

    if (insertError) return res.status(500).json({ error: insertError.message });

    const chunks = chunkDocument(content);

    for (const chunk of chunks) {
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: chunk,
        });

        const embedding = embeddingResponse.data[0].embedding;

        await supabase.from("document_chunks").insert({
            document_id: newDoc.id,
            category_id: categoryId,
            content: chunk,
            embedding,
        });
    }

    res.json({ message: "Document version added successfully", document: newDoc });
};

const chunkDocument = (text: string, chunkSize = 500): string[] => {
    const words = text.split(" ");
    let chunks = [];
    let currentChunk = "";

    for (const word of words) {
        if ((currentChunk + " " + word).length > chunkSize) {
            chunks.push(currentChunk);
            currentChunk = word;
        } else {
            currentChunk += " " + word;
        }
    }

    if (currentChunk) chunks.push(currentChunk);

    return chunks;
};