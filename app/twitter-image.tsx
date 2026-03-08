import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Fırat Tuna Arslan | Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        <svg
          width="120"
          height="120"
          viewBox="0 0 1500 1500"
          style={{ marginBottom: 40 }}
        >
          <path
            fill="#ffffff"
            d="M 1467.84375 282.953125 C 1467.84375 414.214844 1361.453125 520.597656 1230.1875 520.597656 L 458.691406 520.597656 C 454.316406 502.636719 452.023438 483.855469 452.023438 464.519531 C 452.023438 333.253906 558.40625 226.871094 689.664062 226.871094 L 1230.1875 226.871094 C 1305.980469 226.871094 1373.511719 191.375 1417.015625 136.117188 C 1437.765625 162.429688 1453.066406 193.242188 1461.171875 226.871094 C 1465.546875 244.828125 1467.84375 263.613281 1467.84375 282.953125"
          />
          <path
            fill="#ffffff"
            d="M 1089.191406 781.316406 C 1089.191406 872.921875 1037.363281 952.445312 961.390625 992.066406 C 928.527344 1009.230469 891.167969 1018.933594 851.546875 1018.933594 L 523.910156 1018.933594 C 303.460938 1018.933594 116.851562 1163.992188 54.398438 1363.882812 C 39.902344 1317.496094 32.097656 1268.175781 32.097656 1217.019531 C 32.097656 1146.554688 46.910156 1079.546875 73.617188 1018.933594 C 149.835938 845.96875 322.769531 725.199219 523.910156 725.199219 L 851.546875 725.199219 C 927.335938 725.199219 994.863281 689.710938 1038.371094 634.453125 C 1059.117188 660.765625 1074.378906 691.574219 1082.519531 725.199219 C 1086.894531 743.195312 1089.191406 761.980469 1089.191406 781.316406"
          />
        </svg>

        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#ededed",
            letterSpacing: -3,
            lineHeight: 1.1,
            display: "flex",
          }}
        >
          Fırat Tuna Arslan
        </div>

        <div
          style={{
            fontSize: 28,
            color: "#999999",
            marginTop: 16,
            display: "flex",
          }}
        >
          Software & Full-Stack Web Developer
        </div>

        <div
          style={{
            width: 60,
            height: 4,
            borderRadius: 2,
            background: "#ff6b6b",
            marginTop: 32,
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 60,
            fontSize: 20,
            color: "#666666",
            display: "flex",
          }}
        >
          firattunaarslan.me
        </div>
      </div>
    ),
    { ...size }
  );
}
