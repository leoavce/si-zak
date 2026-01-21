import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_ANON_KEY. Check your .env.local",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
