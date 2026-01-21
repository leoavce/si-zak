import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

type Industry = { id: string; name: string };

export default async function Home() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("industries")
    .select("id, name")
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

  const industries = (data ?? []) as Industry[];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">산업 선택</h1>
      <p className="mt-2 text-sm text-neutral-600">
        산업 → 직무 → 직무 상세로 들어가면 더미 공고를 보여줘요.
      </p>

      <ul className="mt-6 grid gap-3">
        {industries.map((i) => (
          <li key={i.id}>
            <Link
              href={`/industry/${i.id}`}
              className="block rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{i.name}</span>
                <span className="text-neutral-500">→</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
