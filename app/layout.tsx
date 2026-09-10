import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "听句 · 英语听写练习室",
  description: "导入视频和字幕，逐句播放两遍，练习英语听写。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
