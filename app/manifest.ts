import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fırat Tuna Arslan | Portfolio",
    short_name: "FTA Portfolio",
    description:
      "Software & Full-Stack Web Developer — AI Engineering student with 8+ years of experience.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/favicon-dark.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
