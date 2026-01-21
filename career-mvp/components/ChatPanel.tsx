"use client";

import { useMemo, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPanel({
  context,
}: {
  context: string;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "원하는 조건(지역/경력/키워드)이나 궁금한 점을 말해줘!",
    },
  ]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !streaming, [input, streaming]);

  async function send() {
    if (!canSend) return;

    const userText = input.trim();
    setInput("");

    const nextMessages: Msg[] = [...messages, { role: "user", content: userText }, { role: "assistant", content: "" }];
    setMessages(nextMessages);

    setStreaming(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          messages: nextMessages
            // 마지막 assistant(빈칸)은 모델에 보내지 않음
            .filter((m, idx) => !(m.role === "assistant" && idx === nextMessages.length - 1))
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Bad response: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });

        // 마지막 assistant 메시지에 계속 덧붙이기
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: acc };
          }
          return copy;
        });
      }
    } catch (e) {
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
    <section className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">채팅</h2>
        {streaming ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
          >
            중지
          </button>
        ) : null}
      </div>

      <div className="mt-3 h-[360px] overflow-auto rounded-xl border border-neutral-100 bg-neutral-50 p-3">
        <div className="space-y-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={[
                "max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-auto bg-neutral-900 text-white"
                  : "mr-auto bg-white text-neutral-900 border border-neutral-200",
              ].join(" ")}
            >
              {m.content}
              {streaming && i === messages.length - 1 && m.role === "assistant" ? (
                <span className="inline-block animate-pulse">▍</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예) 서울/신입, 백엔드 Node 공고 중 추천해줘"
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
    </section>
  );
}