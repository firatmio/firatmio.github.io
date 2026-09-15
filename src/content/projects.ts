export interface Project {
  slug: string;
  title: string;
  year: number;
  summary: string;
  tags: string[];
  /** Relative prominence of the project's neuron (hub size / brightness). 0..1 */
  weight: number;
  featured?: boolean;
  /** Where it lives in public: its source, a live build, … */
  links?: { label: string; href: string }[];
  /** A closer look, for the project's own page. */
  story?: string[];
  highlights?: string[];
}

// Details and links come from each project's public repository (github.com/firatmio).
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
    links: [
      { label: "Live", href: "https://cardioguard-pre.vercel.app/" },
      { label: "Source", href: "https://github.com/firatmio/cardioguard-mg" },
    ],
    story: [
      "CardioGuard is being built to make early diagnosis of cardiovascular disease more accessible. It spans four parts: a patient app that connects to a Holter ECG device over Bluetooth Low Energy, a server that runs every recording through a three-layer AI pipeline, a Next.js web app with a doctor dashboard, and an ESP32 simulator that stands in for the medical hardware.",
      "The pipeline reads the signal with a CNN, weighs it against a rule-based decision engine, and hands the result to MedGemma, which writes a report a person can actually read.",
    ],
    highlights: [
      "Offline-first ECG capture: stored in SQLite on the phone, synced through a pipeline API",
      "Real-time alerts for doctors, alongside patient management and analytics",
      "An ESP32 simulator streaming normal sinus rhythm, tachycardia, bradycardia, arrhythmia and noise — development without a physical device",
    ],
  },
  {
    slug: "mcp-audit",
    title: "mcp-audit",
    year: 2026,
    weight: 0.7,
    summary:
      "Wireshark + auditd, but for MCP: a transparent proxy that records every tool call an agent makes and flags tool poisoning and rug pulls. One Go binary — no daemon, no Docker.",
    tags: ["Go", "MCP", "AI Security"],
    links: [{ label: "Source", href: "https://github.com/firatmio/mcp-audit-proxy" }],
    story: [
      "Every team adopting agents eventually has to answer one question: which tool did our agent call, when, and with what? mcp-audit sits in front of any MCP server — local over stdio, or remote over Streamable HTTP — and writes every message to a JSON-lines log, without touching authentication.",
      "On top of that record it watches for attacks: tool descriptions poisoned with instructions only the model reads, and rug pulls, where a server quietly changes a tool after you approved it.",
    ],
    highlights: [
      "Seven poisoning rules — instruction overrides, hidden markup, concealment, credential bait, exfiltration, cross-tool orders, invisible characters",
      "Rug-pull detection: every tool fingerprinted with SHA-256 and remembered across restarts",
      "Optional RBAC, the one check that blocks — a refused call never reaches the server",
      "Setup is one prefix: mcp-audit run -- in front of the command you already run",
    ],
  },
  {
    slug: "linkup",
    title: "LinkUp",
    year: 2026,
    weight: 0.65,
    summary:
      "Desktop app for chatting and moving files between devices on a local network — over encrypted QUIC, paired with a verification code.",
    tags: ["Rust", "Tauri 2", "QUIC", "React 19"],
    links: [{ label: "Source", href: "https://github.com/firatmio/linkup" }],
    story: [
      "Devices find each other over mDNS, pair by comparing a short authentication string, and from then on reconnect by their pinned keys. Each device carries an Ed25519 identity kept in the OS keychain, and its TLS certificate is derived from it.",
      "Messages keep a persistent history with delivered and seen marks. Files and folders move by drag and drop, with the receiver's approval, resumable transfers and blake3 integrity checks.",
    ],
    highlights: [
      "Measured loopback throughput: 263 MiB/s — about 2.2 Gbit/s — in release builds",
      "Signed auto-updates, a system tray, and a global quick-send shortcut",
    ],
  },
  {
    slug: "groove",
    title: "Groove",
    year: 2026,
    weight: 0.55,
    summary:
      "“The web, as it was meant to be.” A browser — and eventually a search engine — built in the open, governed by its contributors, owned by no one.",
    tags: ["C#", "WinUI 3", "WebView2", "Open Web"],
    links: [
      { label: "Manifesto", href: "https://github.com/firatmio/groove" },
      { label: "Source", href: "https://github.com/firatmio/groove-v2" },
    ],
    story: [
      "The web was built by developers, and slowly the platforms turned that work into their product. Groove is not a product but a collective decision: not here to disrupt Big Tech — here to ignore it.",
      "Its current prototype is a Windows 11-native browser in WinUI 3 on WebView2: a Mica backdrop, vertical tabs, and an address bar that tells a URL from a search on its own.",
    ],
    highlights: [
      "Major changes go through an open RFC process — open proposals, open discussion, open decisions",
      "Clean MVVM architecture with CommunityToolkit.Mvvm",
    ],
  },
  {
    slug: "lofi-pomodoro",
    title: "lofi-pomodoro",
    year: 2025,
    weight: 0.45,
    summary: "Minimalist desktop pomodoro timer built with Rust and Tauri.",
    tags: ["Rust", "Tauri", "TypeScript", "Tailwind CSS"],
    links: [{ label: "Source", href: "https://github.com/firatmio/lofi-pomodoro" }],
    story: [
      "A Pomodoro timer that sits quietly on the desktop: focus, short and long breaks with optional auto-switching, over a low-distraction lofi background of grain, blobs and waves.",
    ],
    highlights: [
      "Tauri v2 and React — fast, low on memory, cross-platform",
      "Stats: completed focus sessions, total focus time and daily streaks",
      "One-key fullscreen focus mode, a frameless title bar and system notifications",
    ],
  },
  {
    slug: "vad",
    title: "VAD",
    year: 2026,
    weight: 0.4,
    summary:
      "Voice activity detection built from scratch in Python — no pre-trained models, just signal processing fundamentals.",
    tags: ["Python", "Signal Processing", "NumPy"],
    links: [{ label: "Source", href: "https://github.com/firatmio/vad-project" }],
    story: [
      "Audio is read as mono and sliced into 20 ms frames. Each frame gets its RMS energy and zero-crossing rate; thresholds with sliding-window smoothing call it speech or silence; consecutive speech frames are merged into segments, cut out, and timestamped to CSV.",
    ],
    highlights: ["Minimal dependencies — numpy, scipy, pydub, matplotlib", "A command-line tool with a tunable energy threshold"],
  },
  {
    slug: "filmbox-promo",
    title: "Filmbox Promo",
    year: 2025,
    weight: 0.5,
    summary: "Film discovery platform built on Next.js 15 and React 19.",
    tags: ["Next.js 15", "React 19", "Tailwind CSS", "TMDB API"],
    links: [
      { label: "Live", href: "https://film-box.netlify.app/" },
      { label: "Source", href: "https://github.com/firatmio/filmbox-promo" },
    ],
    story: [
      "Movie discovery: what's trending this week, the top rated, upcoming releases, filtering by genre and live search — and, for each film, where it can be watched.",
    ],
    highlights: ["Debounced live search", "Watch-provider info — Netflix, Prime, Disney+ and more", "Mobile-first and responsive"],
  },
  {
    slug: "omnisketch",
    title: "OmniSketch",
    year: 2024,
    weight: 0.4,
    summary: "Vector-based minimalist drawing board.",
    tags: ["TypeScript", "HTML5 Canvas", "Vanilla CSS"],
    links: [
      { label: "Live", href: "https://omni-sketch.vercel.app" },
      { label: "Source", href: "https://github.com/firatmio/omni-sketch" },
    ],
    story: [
      "A drawing board that stays out of the way: a pressure-sensitive pen, rectangles, circles, lines, arrows and an eraser, a 32-colour palette with a custom picker, zoom from 10% to 500%, undo and redo.",
    ],
    highlights: ["Export to PNG with a transparent background, JPG, or scalable SVG", "Animated panels and toast notifications"],
  },
];
