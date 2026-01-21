import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

type Track = { id: string; name: string };
type Posting = {
  id: string;
  company: string;
  title: string;
  location: string | null;
  experience: string | null;
  url: string | null;
  created_at: string;
};

export default async function TrackPage({
  params,
}: {
  params: Promise<{ industryId: string; jobId: string; trackId: string }>;
}) {
  const { industryId, jobId, trackId } = await params; // ✅ 언랩

  const supabase = supabaseServer();

  const { data: track } = await supabase
    .from("job_tracks")
    .select("id, name")
    .eq("id", trackId)
    .single();

  const { data, error } = await supabase
    .from("postings")
    .select("id, company, title, location, experience, url, created_at")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="p-6">
        <pre className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          DB error: {error.message}
        </pre>
      </main>
    );
  }

  const postings = (data ?? []) as Posting[];
  const t = track as Track | null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link
        href={`/industry/${industryId}/job/${jobId}`}
        className="text-sm text-neutral-600 hover:underline"
      >
        ← 직무 상세로
      </Link>

      <h1 className="mt-3 text-xl font-semibold">
        공고 리스트{t?.name ? ` · ${t.name}` : ""}
      </h1>

      {postings.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-600">현재 더미 공고가 없어요.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {postings.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="text-base font-semibold">{p.title}</div>
              <div className="mt-1 text-sm text-neutral-700">{p.company}</div>
              <div className="mt-2 text-sm text-neutral-600">
                {(p.location ?? "지역 미정") + " · " + (p.experience ?? "경력 미정")}
              </div>

              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-medium underline"
                >
                  공고 링크 →
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}