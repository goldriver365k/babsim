"use client";

import { useState } from "react";

// 3.1 우측 — 다국어 지원 고려(영어/베트남어/중국어 등). Phase 1은
// 디자인/레이아웃만 다루므로 실제 i18n 데이터 연결 없이 라벨만 표시합니다.
const LANGS = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "zh", label: "中文" },
];

const MENU_LINKS = [
  { icon: "🏠", label: "홈" },
  { icon: "🍴", label: "메뉴" },
  { icon: "🎮", label: "커뮤니티" },
  { icon: "🔔", label: "알림" },
  { icon: "👤", label: "마이페이지" },
];

export default function Header() {
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState(LANGS[0]);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-[560px] items-center justify-between gap-3">
        {/* 3.1 좌측 — BABSIM 로고 + 서브 문구 + 로고 옆 빨간색 블록 아이콘 */}
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="inline-block h-9 w-9 shrink-0 rounded-xl"
            style={{
              background:
                "linear-gradient(165deg, color-mix(in srgb, var(--lego-red) 72%, white) 0%, var(--lego-red) 45%, color-mix(in srgb, var(--lego-red) 80%, black) 100%)",
              boxShadow: "0 2px 0 color-mix(in srgb, var(--lego-red) 62%, black)",
            }}
          />
          <div className="min-w-0">
            <p className="text-lg font-black tracking-tight text-[#14181F]">BABSIM</p>
            <p className="text-[11px] font-bold tracking-wide text-neutral-500">
              EAT · PLAY · CONNECT
            </p>
          </div>
        </div>

        {/* 3.1 우측 — 언어 선택 드롭다운 + 전체메뉴 햄버거 버튼 */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={langOpen}
              className="flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-700"
            >
              <span aria-hidden>🌐</span>
              <span>{lang.label}</span>
              <span aria-hidden className="text-xs opacity-70">
                ▾
              </span>
            </button>
            {langOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 z-10 grid w-max grid-cols-2 gap-1.5 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-lg">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l);
                      setLangOpen(false);
                    }}
                    className={`rounded-lg border px-2.5 py-2 text-xs font-semibold whitespace-nowrap ${
                      lang.code === l.code
                        ? "border-[#1559D6] bg-[#1559D6] text-white"
                        : "border-neutral-300 text-neutral-700"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="전체 메뉴 열기"
            className="rounded-full border border-neutral-300 bg-white p-2 text-lg leading-none"
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="전체 메뉴">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute top-0 right-0 h-full w-[78vw] max-w-[320px] bg-white p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-base font-black">전체 메뉴</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="닫기"
                className="rounded-full p-1 text-xl leading-none text-neutral-500"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {MENU_LINKS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                >
                  <span aria-hidden className="text-lg">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
