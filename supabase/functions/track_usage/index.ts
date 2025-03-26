import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Constants (Adjust based on real average values)
const ESTIMATED_ROW_SIZE_KB = {
  employees: 10,       // Example: 10 KB per row
  messages: 3,
  chats: 5,
  invoices: 15,
  others: 5
};

const DB_USAGE_BUFFER = 1.3;
const FILE_USAGE_BUFFER = 1.2;
const BANDWIDTH_BUFFER = 1.2;

serve(async () => {
  const { data: users, error } = await supabase.from('workspace_users').select('*');
  if (error || !users) {
    return new Response('Failed to fetch users', { status: 500 });
  }

  for (const user of users) {
    const dbUsageGb = await estimateDbUsage(user.workspace_id, user.user_id);
    const fileUsageGb = await estimateFileUsage(user.workspace_id, user.user_id);
    const bandwidthGb = (dbUsageGb + fileUsageGb) * 0.2 * BANDWIDTH_BUFFER;

    const totalGb = dbUsageGb + fileUsageGb + bandwidthGb;

    await supabase.from('user_usage').upsert({
      workspace_id: user.workspace_id,
      user_id: user.user_id,
      db_gb: dbUsageGb,
      file_gb: fileUsageGb,
      bandwidth_gb: bandwidthGb,
      total_gb: totalGb,
      calculated_at: new Date().toISOString()
    });
  }

  return new Response('Usage estimation complete');
});

async function estimateDbUsage(workspace_id: string, user_id: string): Promise<number> {
  let totalKb = 0;

  const tables = Object.keys(ESTIMATED_ROW_SIZE_KB);
  for (const table of tables) {
    const { data: rows, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id)
      .eq('user_id', user_id); // if user_id is part of the table
    if (!error && typeof rows?.count === 'number') {
      const estKb = rows.count * ESTIMATED_ROW_SIZE_KB[table];
      totalKb += estKb;
    }
  }

  const kbWithBuffer = totalKb * DB_USAGE_BUFFER;
  return kbWithBuffer / (1024 * 1024); // Convert KB → GB
}

async function estimateFileUsage(workspace_id: string, user_id: string): Promise<number> {
  const { data: files, error } = await supabase
    .storage
    .from('user_files')
    .list(`${workspace_id}/${user_id}`, { limit: 1000 });

  if (error || !files) return 0;

  const totalBytes = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
  const withBuffer = totalBytes * FILE_USAGE_BUFFER;
  return withBuffer / (1024 ** 3); // Convert to GB
}
