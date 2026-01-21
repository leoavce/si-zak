import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Career MVP",
  description: "산업 → 직무 → 직무 상세 → 공고 리스트 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
