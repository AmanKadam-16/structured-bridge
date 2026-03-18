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
  title: "The Structured Bridge — Probabilistic AI × Deterministic Software",
  description:
    "A technical demonstration of bridging the gap between Probabilistic AI and Deterministic Software using OpenAI Structured Outputs with Pydantic schemas.",
  openGraph: {
    title: "The Structured Bridge",
    description:
      "Bridging Probabilistic AI and Deterministic Software through OpenAI Structured Outputs.",
    images: [
      {
        url: "https://res.cloudinary.com/dwx05vz5l/image/upload/v1773866453/Demo_UI_a3mitn.png",
        width: 1200,
        height: 630,
        alt: "The Structured Bridge — Demo UI",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Structured Bridge",
    description:
      "Bridging Probabilistic AI and Deterministic Software through OpenAI Structured Outputs.",
    images: [
      "https://res.cloudinary.com/dwx05vz5l/image/upload/v1773866453/Demo_UI_a3mitn.png",
    ],
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
