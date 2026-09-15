/** The About stop, told in beats: who, background, focus, stack. */
export const about = {
  name: "Fırat Tuna Arslan",
  role: "Artificial Intelligence Engineering Student & Software Developer",
  background: {
    eyebrow: "Background",
    statement: "Building software since 2017.",
    detail:
      "Systems programming, AI integrations and modern web technologies — designed into production-grade applications.",
    facts: [
      { label: "Studying", value: "Artificial Intelligence Engineering · Trabzon University" },
      { label: "Working", value: "Software Engineer · Quacomes" },
    ],
  },
  focus: {
    eyebrow: "Focus",
    statement: "Efficient, readable, scalable code.",
    detail:
      "From LLM integrations to low-level system architecture: high-performance services in Rust and Go, minimalist web experiences with SolidJS and Next.js.",
  },
  stack: {
    eyebrow: "Stack",
    statement: "What I build with.",
    groups: [
      { label: "Languages", items: ["Go", "Rust", "Python", "TypeScript", "JavaScript"] },
      { label: "Frameworks", items: ["SolidJS", "React", "Next.js", "Tauri"] },
      { label: "AI & backend", items: ["PyTorch", "FastAPI"] },
      { label: "Data & infra", items: ["PostgreSQL", "Supabase", "Docker"] },
    ],
  },
};
