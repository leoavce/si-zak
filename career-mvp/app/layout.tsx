import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "시작 : 맞춤형 취준 서비스",
  description: "개인 맞춤 직무 탐색 / 공고 추천 / 정보 제공 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4921957130658301"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
