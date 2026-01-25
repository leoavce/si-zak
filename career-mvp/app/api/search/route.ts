import { z } from "zod";
import { supabaseAnonServer } from "@/lib/supabase";

export const runtime = "nodejs";

const Body = z.object({
  q: z.string().min(1).max(120),
  limit: z.number().int().min(1).max(30).optional(),
});

export async function POST(req: Request) {
  try {
    const { q, limit } = Body.parse(await req.json());
    const supabase = supabaseAnonServer();

    const k = `%${q}%`;
    const { data, error } = await supabase
      .from("postings")
      .select("id, company, title, location, experience, url, created_at")
      .or(
        `title.ilike.${k},company.ilike.${k},location.ilike.${k},experience.ilike.${k}`,
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 12);

    if (error) return new Response(error.message, { status: 500 });

    return Response.json({ items: data ?? [] });
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message || "Bad Request";
    return new Response(msg, { status: 400 });
  }
}
