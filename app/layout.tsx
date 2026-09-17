import type { Metadata } from "next";
import "./globals.css";
import PwaRegister from "./pwa-register";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "listen-write";
const basePath = process.env.GITHUB_PAGES === "true" && !repositoryName.endsWith(".github.io") ? `/${repositoryName}` : "";

export const metadata: Metadata = {
  title: "听句 · 英语听写练习室",
  description: "导入视频和字幕，逐句播放两遍，练习英语听写。",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "听句",
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: `${basePath}/favicon.svg`,
    shortcut: `${basePath}/favicon.svg`,
    apple: `${basePath}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased"><PwaRegister />{children}</body>
    </html>
  );
}
