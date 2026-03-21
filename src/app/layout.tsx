import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ブライダルプランナー",
  description: "結婚式・披露宴のプランニングを支援するWebアプリケーション",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${notoSansJp.className} min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
