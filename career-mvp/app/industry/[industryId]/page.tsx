import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

type Industry = { id: string; name: string };
type Job = { id: string; name: string };

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ industryId: string }>;
}) {
  const { industryId } = await params; // ✅ Next.js 16: params 언랩

  const supabase = supabaseServer();

  const { data: industry } = await supabase
    .from("industries")
    .select("id, name")
    .eq("id", industryId)
    .single();

  const { data, error } = await supabase
    .from("jobs")
    .select("id, name")
    .eq("industry_id", industryId)
    .order("name", { ascending: true });

  if (error) {
    return (
      <main className="p-6">
        <pre className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          DB error: {error.message}
        </pre>
      </main>
    );
  }

  const jobs = (data ?? []) as Job[];
  const ind = industry as Industry | null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/" className="text-sm text-neutral-600 hover:underline">
        ← 홈
      </Link>

      <h1 className="mt-3 text-xl font-semibold">
        직무 선택{ind?.name ? ` · ${ind.name}` : ""}
      </h1>

      <ul className="mt-6 grid gap-3">
        {jobs.map((j) => (
          <li key={j.id}>
            <Link
              href={`/industry/${industryId}/job/${j.id}`}
              className="block rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{j.name}</span>
                <span className="text-neutral-500">→</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}