import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";
import SignatureCanvas from "@/components/SignatureCanvas";

/**
 * For a project slug that doesn't exist — or any page that doesn't: the journey's opening
 * signature, spelling 404 in the same luminous dust.
 */
export default function NotFound() {
  return (
    <main className="relative min-h-svh">
      <SignatureCanvas text="404" />
      <h1 className="sr-only">Page not found</h1>
      <p className="pointer-events-none fixed top-6 left-6 font-mono text-xs tracking-[0.2em] text-ink/60 uppercase">
        Fırat Tuna Arslan
      </p>

      <div className="pointer-events-none fixed inset-x-0 bottom-10 flex flex-col items-center gap-4 px-6 text-center">
        <p className="text-sm text-ink/60">This page isn&apos;t part of the network.</p>
        <Link
          href="/"
          className="group pointer-events-auto inline-flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-ink/80 uppercase transition-colors hover:text-ink"
        >
          <LuArrowLeft aria-hidden className="size-3.5 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
          Back to the journey
        </Link>
      </div>
    </main>
  );
}
