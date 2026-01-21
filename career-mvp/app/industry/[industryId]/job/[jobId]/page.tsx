import Link from "next/link";
import { supabaseAnonServer } from "@/lib/supabase";

type Job = { id: string; name: string };
type Track = { id: string; name: string };

export default async function JobPage({
  params,
}: {
  params: Promise<{ industryId: string; jobId: string }>;
}) {
  const { industryId, jobId } = await params; // ✅ 언랩

  const supabase = supabaseAnonServer();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, name")
    .eq("id", jobId)
    .single();

  const { data, error } = await supabase
    .from("job_tracks")
    .select("id, name")
    .eq("job_id", jobId)
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

  const tracks = (data ?? []) as Track[];
  const j = job as Job | null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link
        href={`/industry/${industryId}`}
        className="text-sm text-neutral-600 hover:underline"
      >
        ← 직무로
      </Link>

      <h1 className="mt-3 text-xl font-semibold">
        직무 상세 선택{j?.name ? ` · ${j.name}` : ""}
      </h1>

      <ul className="mt-6 grid gap-3">
        {tracks.map((t) => (
          <li key={t.id}>
            <Link
              href={`/industry/${industryId}/job/${jobId}/track/${t.id}`}
              className="block rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.name}</span>
                <span className="text-neutral-500">공고 보기 →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
