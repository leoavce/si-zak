import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "시작하는 모두를 위해",
  description: "산업 → 직무 → 직무 상세 → 공고 리스트 MVP",
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
