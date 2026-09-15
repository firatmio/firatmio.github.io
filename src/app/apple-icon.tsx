import { ImageResponse } from "next/og";
import { MARK } from "@/components/LogoMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The home-screen icon: the site's mark on the journey's void — iOS rounds the corners itself. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#03050a",
        }}
      >
        <svg width="136" height="136" viewBox="0 0 64 64">
          <g transform={MARK.offset}>
            <g fill="none" stroke="#e6ecf5" strokeWidth={3.4} strokeLinecap="round">
              {MARK.dendrites.map((d) => (
                <path key={d} d={d} />
              ))}
              <path d={MARK.loop} />
            </g>
            <path d={MARK.soma} fill="#e6ecf5" />
            <circle cx={MARK.signal.x} cy={MARK.signal.y} r={3.8} fill="#ffb27a" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
