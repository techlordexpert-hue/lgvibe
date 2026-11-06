import type { Metadata, Viewport } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";

const hand = Caveat({ subsets: ["latin"], variable: "--font-hand", display: "swap" });

export const metadata: Metadata = { title: "LGVIBE", description: "Master your courses: notes, playground, quizzes and video tutoring." };
export const viewport: Viewport = { themeColor: "#09090b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={hand.variable}>
      <body className="min-h-screen bg-zinc-950 text-zinc-200 antialiased">{children}</body>
    </html>
  );
}
