"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function escapeText(text: string) {
  return text.replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[m] ?? m;
  });
}

export default function Welcome({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"idle" | "welcoming" | "fadeout">("idle");
  const [lines, setLines] = useState<string[]>([
    "world !",
    "users !",
    "everybody !",
    "there !",
  ]);
  const [hasPrefix, setHasPrefix] = useState(true);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const listKey = useMemo(() => `${lines.join("|")}-${phase}`, [lines, phase]);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      for (const id of timeoutsRef.current) window.clearTimeout(id);
    };
  }, []);

  function handleEnter(value: string) {
    const name = escapeText(value.trim());
    if (!name) return;

    localStorage.setItem("orbit.nickname", name);

    setHasPrefix(false);
    setLines([
      `안녕하세요 ${name} 님,`,
      `${name}님의 모든 순간을`,
      "응원합니다.",
      "환영합니다.",
    ]);

    setPhase("welcoming");

    timeoutsRef.current.push(window.setTimeout(() => setPhase("fadeout"), 2400));
    timeoutsRef.current.push(window.setTimeout(() => onDone(), 3600));
  }

  return (
    <div className={`welcome-root ${phase === "fadeout" ? "fadeout" : ""}`}>
      <div className="content">
        <div className={`content__container ${hasPrefix ? "" : "is-centered"}`}>
          {hasPrefix ? (
            <p className="content__container__text" id="prefix">
              Hello
            </p>
          ) : null}

          <ul className="content__container__list" key={listKey}>
            {lines.map((t, i) => (
              <li className="content__container__list__item" key={i}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="input-wrapper">
        <input
          ref={inputRef}
          id="nicknameInput"
          type="text"
          placeholder="닉네임을 입력하고 Enter"
          maxLength={20}
          disabled={phase !== "idle"}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const v = (e.currentTarget.value || "").trim();
            if (!v) return;
            handleEnter(v);
            e.currentTarget.value = "";
            e.currentTarget.placeholder = "환영합니다 🙂";
          }}
        />
      </div>
    </div>
  );
}
