type Block = {
  key: string;
  color: string; // globals.css의 --lego-x 변수명
  icon: string;
  title: string;
  desc?: string;
  colSpan: number; // 6열 기준
  minH: string; // Tailwind 임의값(min-h-[...])
  interlock?: "tab" | "notch";
  center?: boolean;
};

// 3.2 표를 그대로 데이터로 옮긴 것 — 순서/배치/색상/텍스트가 표의
// 기재 순서와 동일합니다.
const ROWS: Block[][] = [
  [
    {
      key: "event",
      color: "--lego-event",
      icon: "📢",
      title: "이벤트",
      desc: "좋은 날, 더 맛있는 캠퍼스!",
      colSpan: 6,
      minH: "min-h-[112px]",
      center: true,
    },
  ],
  [
    {
      key: "breakfast",
      color: "--lego-breakfast",
      icon: "🍚",
      title: "천원의 아침밥",
      colSpan: 4,
      minH: "min-h-[220px]",
      interlock: "tab",
    },
    {
      key: "room",
      color: "--lego-room",
      icon: "🏠☁️",
      title: "방구하기",
      colSpan: 2,
      minH: "min-h-[220px]",
      interlock: "notch",
    },
  ],
  [
    {
      key: "bapsim",
      color: "--lego-bapsim",
      icon: "🍚🥢",
      title: "밥심",
      colSpan: 2,
      minH: "min-h-[150px]",
    },
    {
      key: "hururuk",
      color: "--lego-hururuk",
      icon: "🍜",
      title: "후루룩찹찹",
      colSpan: 2,
      minH: "min-h-[150px]",
    },
    {
      key: "mangwon",
      color: "--lego-mangwon",
      icon: "📚",
      title: "만권화밥",
      colSpan: 2,
      minH: "min-h-[150px]",
    },
  ],
  [
    {
      key: "hometown",
      color: "--lego-hometown",
      icon: "🌍📍",
      title: "나의 고향 이야기",
      colSpan: 3,
      minH: "min-h-[160px]",
      interlock: "tab",
    },
    {
      key: "friends",
      color: "--lego-friends",
      icon: "👥",
      title: "친구 만들기",
      colSpan: 3,
      minH: "min-h-[160px]",
      interlock: "notch",
    },
  ],
  [
    {
      key: "korean",
      color: "--lego-korean",
      icon: "📖",
      title: "한국어 공부",
      colSpan: 3,
      minH: "min-h-[150px]",
      interlock: "tab",
    },
    {
      key: "ownerchat",
      color: "--lego-ownerchat",
      icon: "💬",
      title: "사장님에게 말하기",
      colSpan: 3,
      minH: "min-h-[150px]",
      interlock: "notch",
    },
  ],
];

function BlockCard({ block }: { block: Block }) {
  const interlockClass =
    block.interlock === "tab"
      ? "lego-tab-right"
      : block.interlock === "notch"
        ? "lego-notch-left"
        : "";

  return (
    <button
      type="button"
      className={`lego-block ${interlockClass} ${block.center ? "items-center text-center" : ""}`}
      style={{ gridColumn: `span ${block.colSpan} / span ${block.colSpan}`, ["--block-color" as string]: `var(${block.color})` }}
    >
      <span className="lego-icon" aria-hidden>
        {block.icon}
      </span>
      <span className="flex flex-col gap-1">
        {block.desc && <span className="lego-desc">{block.desc}</span>}
        <span className="lego-arrow-line">
          <span className="lego-title">{block.title}</span>
          <span className="lego-arrow" aria-hidden>
            →
          </span>
        </span>
      </span>
    </button>
  );
}

export default function LegoBoard() {
  return (
    <div className="flex flex-col gap-2">
      {ROWS.map((row, i) => (
        <div key={i} className="lego-board items-stretch">
          {row.map((block) => (
            <BlockCard key={block.key} block={block} />
          ))}
        </div>
      ))}
    </div>
  );
}
