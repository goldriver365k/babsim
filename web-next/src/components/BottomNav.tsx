"use client";

import { useState } from "react";

// 3.3 — 하단 고정 네비게이션 바(5개 탭)
const ITEMS = [
  { key: "home", icon: "🏠", label: "홈" },
  { key: "menu", icon: "🍴", label: "메뉴" },
  { key: "community", icon: "🎮", label: "커뮤니티" },
  { key: "alerts", icon: "🔔", label: "알림" },
  { key: "my", icon: "👤", label: "마이페이지" },
];

export default function BottomNav() {
  const [active, setActive] = useState("home");

  return (
    <nav
      className="sticky bottom-0 z-40 border-t border-black/10 bg-white"
      aria-label="하단 내비게이션"
    >
      <div className="mx-auto flex w-full max-w-[560px]">
        {ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActive(item.key)}
            aria-pressed={active === item.key}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${
              active === item.key ? "text-[#1465E8]" : "text-neutral-500"
            }`}
          >
            <span className="text-xl leading-none" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
