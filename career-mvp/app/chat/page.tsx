"use client";

import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: userMsg }),
    });

    const data = await res.json();

    setMessages((m) => [
      ...m,
      { role: "ai", text: data.reply },
    ]);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">AI 채팅 (Upstage)</h1>

      <div className="mt-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-xl p-3 text-sm ${
              m.role === "user"
                ? "bg-blue-100 text-right"
                : "bg-neutral-100"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지 입력..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          {loading ? "..." : "전송"}
        </button>
      </div>
    </main>
  );
}