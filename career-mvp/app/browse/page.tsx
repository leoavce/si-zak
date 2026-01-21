import Link from "next/link";
import { supabaseAnonServer } from "@/lib/supabase";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Browse | si-zak" };

type Industry = { id: string; name: string };

export default async function BrowsePage() {
  const supabase = supabaseAnonServer();

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
    <main className="mx-auto max-w-2xl p-6 font-[system-ui]">
      <Link href="/" className="text-sm text-neutral-600 hover:underline">
        ← 채팅으로
      </Link>

      <h1 className="mt-3 text-xl font-semibold">공고 직접 찾아보기</h1>
      <p className="mt-2 text-sm text-neutral-600">
        산업 → 직무 → 직무 상세 → 공고 리스트
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
