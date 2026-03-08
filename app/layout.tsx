import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import GSAPProvider from "@/components/providers/GSAPProvider";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Fırat Tuna Arslan | Portfolio",
  icons: {
    icon: [
      {
        url: "/favicon-light.svg", // Aydınlık modda görünecek olan
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.svg",  // Karanlık modda (asıl kalite burada) görünecek olan
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  description:
    "Software & Full-Stack Web Developer — AI Engineering student with 8+ years of experience building production-grade systems across web, desktop, and AI platforms.",
  keywords: [
    "Fırat Tuna Arslan",
    "Full-Stack Developer",
    "AI Engineer",
    "Portfolio",
    "React",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "Fırat Tuna Arslan" }],
  openGraph: {
    title: "Fırat Tuna Arslan | Portfolio",
    description: "Software & Full-Stack Web Developer",
    url: "https://firattunaarslan.me",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
        <GSAPProvider>
          <CustomCursor />
          <Navbar />
          {children}
        </GSAPProvider>
      </body>
    </html>
  );
}
