import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// 문서 3번(폰트: "라운드 형태의 가독성 좋은 샌세리프")에 가장 가까우면서
// 한글/영문을 모두 안정적으로 지원하는 Google Fonts 조합을 사용합니다.
const notoSansKR = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "babsim.store",
  description: "babsim.store — 캠퍼스 라이프 플랫폼 (디자인 목업, Phase 1)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F5F2EA] font-sans">{children}</body>
    </html>
  );
}
