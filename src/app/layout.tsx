import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Pulse } from "@/components/Pulse";
import "./globals.css";

const TITLE = "Feature Graveyard";
const DESC =
  "Features that shipped and nobody used. Submit yours — what you built, and what happened to it.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <Pulse />
        <Analytics />
      </body>
    </html>
  );
}
