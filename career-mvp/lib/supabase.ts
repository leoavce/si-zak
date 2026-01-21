import { createClient } from "@supabase/supabase-js";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// RLS 적용(권장): browse 같은 읽기는 anon으로
export function supabaseAnonServer() {
  return createClient(must("SUPABASE_URL"), must("SUPABASE_ANON_KEY"), {
    auth: { persistSession: false },
  });
}

// AI tool이 DB를 탐색할 때는 서버에서만 service_role 사용
// ⚠️ service_role은 RLS를 우회하므로 "서버 API에서만" 사용
export function supabaseServiceServer() {
  return createClient(must("SUPABASE_URL"), must("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}
