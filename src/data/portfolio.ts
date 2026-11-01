export interface Project {
  id: string
  title: string
  kind: string
  year: string
  status: "Active" | "Completed"
  summary: string
  points: string[]
  stack: string[]
  href: string
  /** The repository's own website link, when it has one. */
  homepage?: string
}

export interface SideProject {
  id: string
  title: string
  kind: string
  year: string
  summary: string
  stack: string[]
  href: string
  homepage?: string
}

export interface Artwork {
  /** Path without extension: <src>-480/960/1920.avif and .webp exist, and <src>.jpg as the fallback. */
  src: string
  width: number
  height: number
  /** object-position for the crop, shared by the tile and its page. */
  position: string
  /** Colour shown before the picture loads. */
  ground: string
  title: string
  artist: string
  source: string
  href: string
  license: string
}

export interface Tool {
  name: string
  /** Export name in the simple-icons package. */
  icon: string
  /** Ids of projects and side projects that use it. */
  usedIn: string[]
}

export const portfolioData = {
  name: "Fırat Tuna Arslan",
  role: "AI engineering student and systems developer",
  intro:
    "I build developer tools and AI pipelines in Go, Rust and Python. Right now: verified memory for coding agents, security for MCP servers, and clinical ECG models.",
  about: [
    "AI Engineering student at Trabzon University, writing code for over eight years.",
    "I like low-level work with clean interfaces: proxies, engines, CLIs, and the models that run behind them.",
  ],
  availability: "Open to internships and freelance work on tooling, backend and applied ML.",
  principles: [
    {
      title: "Check, don’t trust",
      text: "A fact an agent relies on should prove itself against the code every time it is used.",
      project: "aletheia",
      href: "https://github.com/firatmio/aletheia",
    },
    {
      title: "Local first",
      text: "Tools that watch your work should run on your machine and send nothing anywhere by default.",
      project: "mcp-audit-proxy",
      href: "https://github.com/firatmio/mcp-audit-proxy",
    },
    {
      title: "Report what didn’t work",
      text: "A negative result written up honestly is still a result someone else can use.",
      project: "mbpp-tr",
      href: "https://github.com/firatmio/mbpp-tr-finetune",
    },
    {
      title: "Fewer dependencies",
      text: "One binary or one file you can read beats a tree of packages you can’t.",
      project: "pywraps",
      href: "https://github.com/firatmio/pywraps",
    },
  ],
  faq: [
    {
      q: "What work are you open to?",
      a: "Internships and freelance work on developer tooling, backend systems and applied ML.",
    },
    {
      q: "What are you building right now?",
      a: "aletheia, memory for coding agents that checks itself against your code, and mcp-audit-proxy, a lockfile for MCP tools.",
    },
    {
      q: "Why Go for your tools?",
      a: "One static binary, a fast start and an easy install on every platform, which matters for a CLI that sits in front of other tools.",
    },
    {
      q: "Where can I see your ML work?",
      a: "mbpp-tr and its fine-tune experiments on GitHub and Hugging Face, and the ECG models inside cardioguard-mg.",
    },
    {
      q: "How do I reach you?",
      a: "Email firattunaarslan@gmail.com, or find me as firatmio on GitHub, Hugging Face and X.",
    },
  ],
  // Shown when the GitHub API cannot be reached.
  githubFallback: { stars: 16, release: "v0.1.1", repos: 25 },
  // Paintings behind some tiles, keyed by tile id. The page that opens from the tile uses the same picture.
  artworks: {
    aletheia: {
      src: "/media/sacred-grove",
      width: 1920,
      height: 837,
      position: "62% 40%",
      ground: "#2f3a27",
      title: "The Sacred Grove, Beloved of the Arts and the Muses",
      artist: "Pierre Puvis de Chavannes",
      source: "Art Institute of Chicago",
      href: "https://www.artic.edu/artworks/81566",
      license: "public domain",
    },
    "side-projects": {
      src: "/media/shepherds-song",
      width: 1920,
      height: 1837,
      position: "50% 32%",
      ground: "#3d4c66",
      title: "The Shepherd’s Song",
      artist: "Pierre Puvis de Chavannes",
      source: "The Metropolitan Museum of Art",
      href: "https://www.metmuseum.org/art/collection/search/437344",
      license: "public domain",
    },
  } as Record<string, Artwork>,
  location: "Trabzon",
  email: "firattunaarslan@gmail.com",
  links: [
    { label: "GitHub", href: "https://github.com/firatmio", handle: "firatmio" },
    { label: "Hugging Face", href: "https://huggingface.co/firatmio", handle: "firatmio" },
    { label: "LinkedIn", href: "https://linkedin.com/in/firattunaarslan", handle: "firattunaarslan" },
    { label: "X", href: "https://x.com/firattunaarslan", handle: "firattunaarslan" },
  ],
  projects: [
    {
      id: "mcp-audit-proxy",
      title: "mcp-audit-proxy",
      kind: "Lockfile for MCP tools",
      year: "2026",
      status: "Active",
      summary: "A package-lock and flight recorder for MCP tool descriptions.",
      points: [
        "Pins every tool on first sight and raises an alarm when a server changes one, until you approve it",
        "Records every call, its arguments and its result to a local JSONL log",
        "Flags prompt injection in tool descriptions and tool results",
        "Runs locally as one Go binary: no account, no cloud, no telemetry",
      ],
      stack: ["Go", "MCP", "JSON-RPC"],
      href: "https://github.com/firatmio/mcp-audit-proxy",
    },
    {
      id: "cardioguard-mg",
      title: "cardioguard-mg",
      kind: "Cardiac telemetry and AI",
      year: "2026",
      status: "Active",
      summary: "Real-time Holter ECG monitoring with a three-layer anomaly pipeline.",
      points: [
        "Collects cardiac data from Holter ECG devices in real time",
        "A CNN, a rule engine and MedGemma read the signal in layers",
        "Clinical monitoring for both patients and doctors, web and mobile",
      ],
      stack: ["Python", "TypeScript", "Next.js", "React Native", "MedGemma"],
      href: "https://github.com/firatmio/cardioguard-mg",
      homepage: "https://cardioguard-pre.vercel.app/",
    },
    {
      id: "aletheia",
      title: "aletheia",
      kind: "Memory for coding agents",
      year: "2026",
      status: "Active",
      summary: "Memory your coding agent can verify. Stale facts never reach its context.",
      points: [
        "Every memory is a claim plus evidence: a function, line or file that must still exist",
        "Evidence is re-checked on every recall, with no model calls, embeddings or network",
        "Follows moved code and points the agent at the exact lines to read",
        "One binary, on npm, Go, Homebrew and Scoop, and in the MCP Registry",
      ],
      stack: ["Go", "MCP"],
      href: "https://github.com/firatmio/aletheia",
      homepage: "https://aletheia.firattunaarslan.me",
    },
  ] as Project[],
  sideProjects: [
    {
      id: "linkup",
      title: "linkup",
      kind: "LAN chat and file transfer",
      year: "2026",
      summary: "Chat and file transfer between devices on the same local network.",
      stack: ["Rust", "Tauri", "React"],
      href: "https://github.com/firatmio/linkup",
    },
    {
      id: "ahar",
      title: "Ahar",
      kind: "Desktop app",
      year: "2026",
      summary: "A desktop app for writing documents together as a team.",
      stack: ["Desktop"],
      href: "https://github.com/firatmio/ahar-releases",
    },
    {
      id: "mbpp-tr",
      title: "mbpp-tr",
      kind: "Dataset and fine-tune",
      year: "2026",
      summary:
        "A Turkish translation of MBPP with review tools, and LoRA fine-tunes of Qwen3-1.7B on it, reported honestly as a negative result.",
      stack: ["Python", "PyTorch", "LoRA"],
      href: "https://github.com/firatmio/mbpp-tr",
      homepage: "https://huggingface.co/datasets/firatmio/mbpp-tr",
    },
    {
      id: "db-viewer",
      title: "db-viewer",
      kind: "Database explorer",
      year: "2026",
      summary: "A database viewing and management tool built for performance and ease of use.",
      stack: ["Tauri", "TypeScript"],
      href: "https://github.com/firatmio/db-viewer",
    },
    {
      id: "go-auth",
      title: "go-auth",
      kind: "Auth service",
      year: "2026",
      summary: "An extensible authentication and authorization system in Go.",
      stack: ["Go"],
      href: "https://github.com/firatmio/go-auth",
    },
    {
      id: "pywraps",
      title: "pywraps",
      kind: "Python library",
      year: "2025",
      summary: "Retry, timeout, debounce and background decorators with zero dependencies.",
      stack: ["Python"],
      href: "https://github.com/firatmio/pywraps",
      homepage: "https://pypi.org/project/pywraps",
    },
    {
      id: "reveal-animation",
      title: "reveal-animation",
      kind: "React component",
      year: "2026",
      summary: "A small React component that plays CSS animations as elements scroll into view.",
      stack: ["React", "TypeScript"],
      href: "https://github.com/firatmio/reveal-animation",
      homepage: "https://firatmio-reveal-animation.vercel.app/",
    },
  ] as SideProject[],
  stack: [
    {
      group: "Languages",
      tools: [
        { name: "Go", icon: "siGo", usedIn: ["aletheia", "mcp-audit-proxy", "go-auth"] },
        { name: "Rust", icon: "siRust", usedIn: ["linkup"] },
        { name: "Python", icon: "siPython", usedIn: ["cardioguard-mg", "mbpp-tr", "pywraps"] },
        { name: "TypeScript", icon: "siTypescript", usedIn: ["cardioguard-mg", "db-viewer", "reveal-animation"] },
      ],
    },
    {
      group: "AI",
      tools: [
        { name: "PyTorch", icon: "siPytorch", usedIn: ["mbpp-tr", "cardioguard-mg"] },
        { name: "Hugging Face", icon: "siHuggingface", usedIn: ["mbpp-tr"] },
        { name: "Jupyter", icon: "siJupyter", usedIn: ["mbpp-tr"] },
        { name: "Model Context Protocol", icon: "siModelcontextprotocol", usedIn: ["aletheia", "mcp-audit-proxy"] },
      ],
    },
    {
      group: "Apps",
      tools: [
        { name: "React", icon: "siReact", usedIn: ["linkup", "reveal-animation", "cardioguard-mg"] },
        { name: "Next.js", icon: "siNextdotjs", usedIn: ["cardioguard-mg"] },
        { name: "Tauri", icon: "siTauri", usedIn: ["linkup", "db-viewer"] },
        { name: "Android", icon: "siAndroid", usedIn: ["cardioguard-mg"] },
      ],
    },
  ] as { group: string; tools: Tool[] }[],
}
