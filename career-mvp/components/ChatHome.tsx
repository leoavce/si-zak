"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatHome() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "안녕! 원하는 산업/직무/조건(지역/경력/키워드)을 말해주면 DB에서 공고를 찾아서 보여줄게.\n예) 'IT/보안 백엔드 Node, 서울 신입 위주로 보여줘'",
    },
  ]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !streaming,
    [input, streaming],
  );

  async function send() {
    if (!canSend) return;

    const userText = input.trim();
    setInput("");

    const next: Msg[] = [
      ...messages,
      { role: "user", content: userText },
      { role: "assistant", content: "" },
    ];
    setMessages(next);

    setStreaming(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/agent-chat", {
        method: "POST",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next
            .filter(
              (m, idx) =>
                !(m.role === "assistant" && idx === next.length - 1),
            )
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Bad response: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: acc };
          }
          return copy;
        });
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = {
            ...last,
            content: last.content || "에러가 났어. 잠시 후 다시 시도해줘.",
          };
        }
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
            aria-label="직접 찾아보기"
          >
            <span aria-hidden>☰</span>
            직접 찾아보기
          </button>

          <div className="text-sm font-semibold">시작하는 모두를 위해 : 취업 준비 가이드</div>

          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
            >
              중지
            </button>
          ) : (
            <span className="text-xs text-neutral-500">DB 기반 추천</span>
          )}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-20">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[320px] bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="font-semibold">메뉴</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-2 py-1 text-sm hover:bg-neutral-50"
              >
                닫기
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/browse");
                }}
                className="w-full rounded-xl border p-3 text-left text-sm hover:bg-neutral-50"
              >
                공고 직접 찾아보기 →
              </button>
              <div className="text-xs text-neutral-500">
                * 채팅은 DB를 탐색해서 결과를 요약해줘요.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-4xl p-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="h-[62vh] overflow-auto rounded-xl border bg-neutral-50 p-3">
            <div className="space-y-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={[
                    "max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "ml-auto bg-neutral-900 text-white"
                      : "mr-auto border bg-white text-neutral-900",
                  ].join(" ")}
                >
                  {m.content}
                  {streaming &&
                  i === messages.length - 1 &&
                  m.role === "assistant" ? (
                    <span className="inline-block animate-pulse">▍</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="조건을 입력해줘 (예: IT/보안 백엔드 Node, 서울 신입)"
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={streaming}
            />
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
