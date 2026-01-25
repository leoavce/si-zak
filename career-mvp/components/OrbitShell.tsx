"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };
type Posting = {
  id: string;
  company: string;
  title: string;
  location: string | null;
  experience: string | null;
  url: string | null;
  created_at: string;
};

const DICT = {
  ko: {
    "meta.title": "Orbit Chat — 취업 준비 도움 서비스",
    "header.start": "직접 검색",
    "header.back": "AI 검색",
    "hero.title": "취업 준비 AI 도우미",
    "hero.subtitle":
      "원하는 직무/지역/경력 조건을 알려주면 공고를 찾아 요약해줘요.",
    "chat.placeholder": "예: 보안 백엔드 신입, 서울 위주로 보여줘",
    "chat.greeting":
      "안녕하세요! 원하는 직무, 지역, 경력 조건을 말해주면 공고를 찾아서 요약해줄게요.",
    "chips.leadtime": "서울 신입 백엔드",
    "chips.mail": "보안 직무 공고",
    "chips.review": "데이터 분석 인턴",
    "chips.automation": "경력 2~3년 프론트엔드",
    "search.title": "직접 검색",
    "search.subtitle": "키워드로 공고를 조회해요.",
    "search.placeholder": "예: 서울 백엔드 신입",
    "search.empty": "검색 결과가 아직 없어요.",
  },
  en: {
    "meta.title": "Orbit Chat — Job Prep Service",
    "header.start": "Direct search",
    "header.back": "AI search",
    "hero.title": "Job Prep AI Assistant",
    "hero.subtitle":
      "Tell me role/location/experience and I will summarize matching postings.",
    "chat.placeholder": "e.g. Backend, junior, Seoul",
    "chat.greeting":
      "Hi! Tell me the role, location, and experience you want, and I will summarize matching postings.",
    "chips.leadtime": "Seoul junior backend",
    "chips.mail": "Security postings",
    "chips.review": "Data analyst intern",
    "chips.automation": "Frontend 2-3 years",
    "search.title": "Direct search",
    "search.subtitle": "Search postings by keywords.",
    "search.placeholder": "e.g. Seoul backend junior",
    "search.empty": "No results yet.",
  },
} as const;

function getLang() {
  return (localStorage.getItem("orbit.lang") as "ko" | "en") || "ko";
}

function setLang(lang: "ko" | "en") {
  localStorage.setItem("orbit.lang", lang);
}

export default function OrbitShell() {
  const [lang, setLangState] = useState<"ko" | "en">("ko");
  const [mode, setMode] = useState<"ai" | "search">("ai");
  const dict = DICT[lang];
  const isSearch = mode === "search";

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: DICT.ko["chat.greeting"] },
  ]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const chatTextRef = useRef<HTMLInputElement | null>(null);
  const streamEndRef = useRef<HTMLDivElement | null>(null);
  const [searchItems, setSearchItems] = useState<Posting[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchTouched, setSearchTouched] = useState(false);

  const chips = useMemo(
    () => [
      { key: "chips.leadtime", seed: "서울 신입 백엔드 공고 보여줘." },
      { key: "chips.mail", seed: "보안 직무 공고 추천해줘." },
      { key: "chips.review", seed: "데이터 분석 인턴 공고 찾아줘." },
      { key: "chips.automation", seed: "경력 2~3년 프론트엔드 공고 알려줘." },
    ],
    [],
  );

  useEffect(() => {
    const saved = getLang();
    setLangState(saved);
    document.title = DICT[saved]["meta.title"];
    document.documentElement.lang = saved === "en" ? "en" : "ko";
  }, []);

  useEffect(() => {
    document.title = dict["meta.title"];
    document.documentElement.lang = lang === "en" ? "en" : "ko";
    setLang(lang);
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.role === "assistant") {
        return [{ role: "assistant", content: dict["chat.greeting"] }];
      }
      return prev;
    });
  }, [lang, dict]);

  useEffect(() => {
    if (!isSearch) {
      streamEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, streaming, isSearch]);

  async function sendChat(userText: string) {
    const value = userText.trim();
    if (!value) return;

    if (isSearch) {
      await runSearch(value);
      chatTextRef.current?.focus();
      return;
    }

    const next: Msg[] = [
      ...messages,
      { role: "user", content: value },
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
        const { value: chunk, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(chunk, { stream: true });

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
            content: last.content || "(에러)",
          };
        }
        return copy;
      });
    } finally {
      setStreaming(false);
      chatTextRef.current?.focus();
    }
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  async function runSearch(query: string) {
    const value = query.trim();
    if (!value) return;

    setSearchTouched(true);
    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: value, limit: 12 }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { items: Posting[] };

      setSearchItems(data.items || []);
    } catch (e: unknown) {
      const message = (e as { message?: string })?.message || "Search error";
      setSearchError(message);
    } finally {
      setSearchLoading(false);
    }
  }

  function toggleMode() {
    setMode((m) => {
      const next = m === "ai" ? "search" : "ai";
      if (next === "search") {
        stop();
        setSearchItems([]);
        setSearchError(null);
        setSearchTouched(false);
      }
      return next;
    });
    window.setTimeout(() => chatTextRef.current?.focus(), 50);
  }

  return (
    <>
      <div className="header-wrapper">
        <header className="topbar">
          <a
            className="brand"
            href="#"
            aria-label="Orbit"
            onClick={(e) => e.preventDefault()}
          >
            <span className="mark" />
            <span className="word">시작</span>
          </a>

          <div className="lang-toggle" role="group" aria-label="Language toggle">
            <span className="lang-label" id="lblKR">
              한국어
            </span>

            <label className="switch" aria-label="KR / EN">
              <input
                id="langSwitch"
                type="checkbox"
                checked={lang === "en"}
                onChange={(e) => setLangState(e.target.checked ? "en" : "ko")}
              />
              <span className="slider" aria-hidden="true" />
            </label>

            <span className="lang-label" id="lblEN">
              English
            </span>
          </div>

          <div className="actions">
            <button id="btnStart" className="primary" onClick={toggleMode}>
              <span id="btnStartText">
                {isSearch ? dict["header.back"] : dict["header.start"]}
              </span>
              <span className="material-symbols-outlined" id="btnStartIcon">
                {isSearch ? "arrow_back" : "arrow_forward"}
              </span>
            </button>

            {!isSearch && streaming ? (
              <button className="primary" type="button" onClick={stop}>
                <span className="material-symbols-outlined">stop_circle</span>
                Stop
              </button>
            ) : null}
          </div>
        </header>
      </div>

      <main className={isSearch ? "search-mode" : "ai-mode"}>
        <section id="chatPage" className="chat-page">
          <div className="chat-shell">
            <div className="chat-hero" id="chatHero">
              <h1 className="chat-title">
                {isSearch ? dict["search.title"] : dict["hero.title"]}
              </h1>
              <p className="chat-subtitle">
                {isSearch ? dict["search.subtitle"] : dict["hero.subtitle"]}
              </p>

              <form
                className="searchbar"
                id="chatForm"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = (chatTextRef.current?.value || "").trim();
                  if (!v) return;
                  if (chatTextRef.current) chatTextRef.current.value = "";
                  sendChat(v);
                }}
              >
                <span
                  className="material-symbols-outlined icon"
                  aria-hidden="true"
                >
                  search
                </span>

                <input
                  ref={chatTextRef}
                  id="chatText"
                  type="text"
                  placeholder={
                    isSearch
                      ? dict["search.placeholder"]
                      : dict["chat.placeholder"]
                  }
                />

                <button className="send" type="submit" aria-label="Send">
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    send
                  </span>
                </button>
              </form>

              {!isSearch ? (
                <div className="chips" id="chips">
                  {chips.map((c) => (
                    <button
                      key={c.key}
                      className="chip"
                      type="button"
                      onClick={() => {
                        if (!chatTextRef.current) return;
                        chatTextRef.current.value = c.seed;
                        chatTextRef.current.focus();
                      }}
                    >
                      {dict[c.key as keyof typeof dict] as string}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {!isSearch ? (
              <div className="results" id="results" aria-live="polite">
                <div className="stream" id="chatStream">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`msg ${m.role === "user" ? "user" : "assistant"}`}
                    >
                      {m.role === "assistant" ? (
                        <div className="badge">AI</div>
                      ) : null}
                      <div className="bubble">
                        {m.content}
                        {streaming &&
                        i === messages.length - 1 &&
                        m.role === "assistant" ? (
                          <span className="cursor">▍</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <div ref={streamEndRef} />
                </div>
              </div>
            ) : null}

            {isSearch ? (
              <div className="search-results">
                {searchError ? (
                  <div className="search-error">{searchError}</div>
                ) : null}
                <div className="grid3 search-grid">
                  {searchItems.map((p) => (
                    <article className="card feature" key={p.id}>
                      <div className="icon">
                        <span className="material-symbols-outlined">work</span>
                      </div>
                      <h3>{p.title}</h3>
                      <p>
                        {p.company}
                        <br />
                        <span className="muted">
                          {p.location ?? (lang === "en" ? "N/A" : "지역 미정")}
                          {" · "}
                          {p.experience ?? (lang === "en" ? "N/A" : "경력 미정")}
                        </span>
                      </p>
                      {p.url ? (
                        <p style={{ marginTop: 10 }}>
                          <a
                            className="link"
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {lang === "en" ? "Open posting →" : "공고 링크 →"}
                          </a>
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>

                {!searchLoading &&
                searchTouched &&
                searchItems.length === 0 ? (
                  <p className="muted search-empty">{dict["search.empty"]}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}
