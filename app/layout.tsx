import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "GitGyan — Where Developers Find Wisdom",
  description:
    "GitGyan scans GitHub daily, finds high-signal repos, and analyzes them with AI. Where developers find wisdom — ranked before it goes viral.",
  metadataBase: new URL("https://gitgyan.dev"),
  openGraph: {
    title: "GitGyan — Where Developers Find Wisdom",
    description:
      "AI-powered GitHub discovery. High-signal repos, ranked and summarized before they go viral.",
    url: "https://gitgyan.dev",
    siteName: "GitGyan",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitGyan — Where Developers Find Wisdom",
    description:
      "AI-powered GitHub discovery. High-signal repos, ranked and summarized before they go viral.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${dmSans.variable} ${dmMono.variable} h-full`}
    >
      <body className="min-h-full bg-[#06080f] text-[#f0f2ff] antialiased">
        {children}
      </body>
    </html>
  );
}
