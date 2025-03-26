import { supabase } from "@/lib/supabaseClient";

export const getFAQs = async (req: any, res: any) => {
    const { categoryId } = req.params;

    const { data, error } = await supabase.from("faqs").select("*").eq("category_id", categoryId);

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
};