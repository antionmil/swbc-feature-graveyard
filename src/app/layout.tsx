import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter_Tight } from "next/font/google";
import { Pulse } from "@/components/Pulse";
import "./globals.css";

/* Self-hosted, not linked from Google. The stylesheet link was render-blocking
   on every route — a slow or blocked fonts.googleapis.com delayed first paint
   everywhere — and it handed every visitor's IP and user agent to a third party
   before the page appeared, on a site with no consent surface. next/font pulls
   the file at BUILD time and serves it from our own origin, which removes both
   problems and the two preconnects with them. */
const inter = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter-tight",
});

const TITLE = "Feature Graveyard";
const DESC =
  "Features that shipped and nobody used. Submit yours — what you built, and what happened to it.";

export const metadata: Metadata = {
  /* Without a metadataBase, a relative OG image resolves against localhost in
     the built output and against nothing at all in an unfurler. */
  metadataBase: new URL("https://featuregraveyard.onedaybuilt.com"),
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website", siteName: TITLE },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Set before first paint. Without this a returning visitor who chose
            light sees a dark page for one frame and then a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('fg.theme');if(t==='light')document.documentElement.dataset.theme='light'}catch(e){}",
          }}
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
