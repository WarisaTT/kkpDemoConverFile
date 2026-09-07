import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KKP AI Data Transformation Platform",
  description: "ระบบแปลงและจัดการโครงสร้างข้อมูลรายงานทางการเงินสากลของ KKP ด้วย AI อัจฉริยะ",
  icons: {
    icon: "/kkp-logo.png",
    shortcut: "/kkp-logo.png",
    apple: "/kkp-logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
