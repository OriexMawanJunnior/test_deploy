import { supabase } from "../lib/supabaseClient";

export const getCategories = async (req: any, res: any) => {
    const { data, error } = await supabase.from("helpdesk_categories").select("*");

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
};