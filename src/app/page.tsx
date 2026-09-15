import SceneCanvas from "@/components/SceneCanvas";

export default function Home() {
  return (
    <main className="relative">
      <SceneCanvas />
      <p className="pointer-events-none fixed top-6 left-6 font-mono text-xs tracking-[0.2em] text-ink/60 uppercase">
        Fırat Tuna Arslan
      </p>
    </main>
  );
}
