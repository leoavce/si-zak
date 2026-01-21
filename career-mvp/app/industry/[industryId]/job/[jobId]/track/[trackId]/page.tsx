import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import ChatPanel from "@/components/ChatPanel";

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
  const { industryId, jobId, trackId } = await params;

  const supabase = supabaseServer();

  const { data: track } = await supabase
    .from("job_tracks")
    .select("id, name")
    .eq("id", trackId)
    .single();

  const { data: postings, error } = await supabase
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

  const t = track as Track | null;
  const list = (postings ?? []) as Posting[];

  // 채팅에 넘길 간단 컨텍스트(공고 제목/회사만)
  const context = [
    `선택한 트랙: ${t?.name ?? "(unknown)"}`,
    `공고 목록(최대 10개):`,
    ...list.slice(0, 10).map((p, idx) => `${idx + 1}. ${p.company} - ${p.title}`),
  ].join("\n");

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link
        href={`/industry/${industryId}/job/${jobId}`}
        className="text-sm text-neutral-600 hover:underline"
      >
        ← 직무 상세로
      </Link>

      <h1 className="mt-3 text-xl font-semibold">
        공고 리스트{t?.name ? ` · ${t.name}` : ""}
      </h1>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* 왼쪽: 공고 */}
        <section className="space-y-3">
          {list.length === 0 ? (
            <p className="text-sm text-neutral-600">현재 더미 공고가 없어요.</p>
          ) : (
            <ul className="grid gap-3">
              {list.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4"
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
        </section>

        {/* 오른쪽: 채팅 */}
        <ChatPanel context={context} />
      </div>
    </main>
  );
}