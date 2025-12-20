import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TermSync - AI 기술 문서 용어 통일",
  description: "AI가 당신의 문서를 분석하여 용어를 자동으로 통일하고 관리합니다.",
  keywords: ["용어 통일", "기술 문서", "AI", "문서 관리", "용어 표준화"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
        {children}
      </body>
    </html>
  );
}

