import {
  siAndroid,
  siGo,
  siHuggingface,
  siJupyter,
  siModelcontextprotocol,
  siNextdotjs,
  siPython,
  siPytorch,
  siReact,
  siRust,
  siTauri,
  siTypescript,
  type SimpleIcon,
} from "simple-icons"

// Brand marks from simple-icons (CC0 SVGs, official brand colours). Imported one by one so the bundle stays small.
const ICONS: Record<string, SimpleIcon> = {
  siAndroid,
  siGo,
  siHuggingface,
  siJupyter,
  siModelcontextprotocol,
  siNextdotjs,
  siPython,
  siPytorch,
  siReact,
  siRust,
  siTauri,
  siTypescript,
}

// Near-black brand colours (Rust, Next.js, MCP) would vanish on a dark ground, so they follow the text colour instead.
function isNearBlack(hex: string) {
  const n = parseInt(hex, 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 40
}

export function BrandIcon({ icon, className }: { icon: string; className?: string }) {
  const si = ICONS[icon]
  if (!si) return null
  const brand = isNearBlack(si.hex) ? "currentColor" : `#${si.hex}`
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ "--brand": brand } as React.CSSProperties}
      aria-hidden="true"
      focusable="false"
    >
      <path d={si.path} />
    </svg>
  )
}
