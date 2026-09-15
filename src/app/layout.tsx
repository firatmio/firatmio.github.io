import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

/** The opening "FTA" signature is drawn in particles with this typeface. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const description =
  "Artificial Intelligence Engineering student & software developer — systems programming, AI integrations and modern web.";

export const metadata: Metadata = {
  metadataBase: new URL("https://firattunaarslan.me"),
  title: "Fırat Tuna Arslan",
  description,
  // The share image is the opening signature itself (opengraph-image.png, captured from the scene).
  openGraph: { type: "website", url: "/", siteName: "Fırat Tuna Arslan", title: "Fırat Tuna Arslan", description },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#03050a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
