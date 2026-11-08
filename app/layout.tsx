import type { Metadata, Viewport } from "next";
import { env } from "@/lib/env";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/500.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/700.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "SELVEDGE / a shared handweaving studio",
    template: "%s / SELVEDGE",
  },
  description:
    "Draft cloth on multi-shaft looms, manage naturally dyed yarn by dye lot, warp projects, weave pick by pick, and release immutable patterns. A deterministic drawdown engine renders the exact cloth face.",
  alternates: { canonical: env.siteUrl },
  openGraph: {
    title: "SELVEDGE / a shared handweaving studio",
    description:
      "Draft cloth, manage dye lots, warp looms, weave pick by pick, and release immutable patterns.",
    url: env.siteUrl,
    siteName: "SELVEDGE",
    type: "website",
    images: [{ url: "/og-card.png", width: 1280, height: 640, alt: "SELVEDGE, a shared handweaving studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SELVEDGE / a shared handweaving studio",
    description: "Draft cloth, manage dye lots, weave pick by pick, release immutable patterns.",
    images: ["/og-card.png"],
  },
  icons: { icon: ["/favicon.svg", "/icon.svg"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#23201c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const bootTheme = `(() => {
    try {
      const stored = window.localStorage.getItem("selvedge-theme");
      const theme = stored === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.dataset.theme = "light";
      document.documentElement.style.colorScheme = "light";
    }
  })();`;

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootTheme }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}