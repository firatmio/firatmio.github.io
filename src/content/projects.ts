export interface Project {
  slug: string;
  title: string;
  year: number;
  summary: string;
  tags: string[];
  /** Relative prominence of the project's neuron (hub size / brightness). 0..1 */
  weight: number;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: "myelin",
    title: "Myelin",
    year: 2026,
    featured: true,
    weight: 1,
    summary:
      "Bio-mimetic inference engine that runs high-performance local LLMs on consumer hardware without cloud dependency. Dynamic layer-masking decides at the CUDA kernel level which layers stay active; on Llama 3.2 1B it preserves perplexity 74×–433× better than naive approaches.",
    tags: ["Rust", "CUDA", "Protobuf", "LLM Inference"],
  },
  {
    slug: "axiom",
    title: "Axiom",
    year: 2026,
    weight: 0.8,
    summary:
      "Local-first, privacy-focused desktop AI assistant. Automates terminal workflows, runs open-source LLMs offline through Ollama and guards developer tasks with a Rust security engine.",
    tags: ["Rust", "Ollama", "Tauri", "Security Engine"],
  },
  {
    slug: "cardioguard",
    title: "CardioGuard",
    year: 2026,
    weight: 0.75,
    summary:
      "End-to-end health-tech platform that analyses Holter ECG data with Google MedGemma and CNN models for cardiac anomaly detection.",
    tags: ["Python", "PyTorch", "Go", "Next.js", "MedGemma", "Docker"],
  },
  {
    slug: "lofi-pomodoro",
    title: "lofi-pomodoro",
    year: 2025,
    weight: 0.45,
    summary: "Minimalist desktop pomodoro timer built with Rust and Tauri.",
    tags: ["Rust", "Tauri", "TypeScript", "Tailwind CSS"],
  },
  {
    slug: "filmbox-promo",
    title: "Filmbox Promo",
    year: 2025,
    weight: 0.5,
    summary: "Film discovery platform built on Next.js 15 and React 19.",
    tags: ["Next.js 15", "React 19", "Tailwind CSS", "TMDB API"],
  },
  {
    slug: "omnisketch",
    title: "OmniSketch",
    year: 2024,
    weight: 0.4,
    summary: "Vector-based minimalist drawing board.",
    tags: ["TypeScript", "HTML5 Canvas", "Vanilla CSS"],
  },
];
