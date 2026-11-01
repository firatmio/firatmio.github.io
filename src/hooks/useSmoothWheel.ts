import { useEffect, type RefObject } from "react"

// Eases mouse-wheel scrolling inside one scroll container. Touch, keyboard and the
// scrollbar keep their native behaviour; the target follows them when they move it.
export function useSmoothWheel(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let current = el.scrollTop
    let target = current
    let raf = 0

    const step = () => {
      current += (target - current) * 0.12
      if (Math.abs(target - current) < 0.5) current = target
      el.scrollTop = current
      raf = current === target ? 0 : requestAnimationFrame(step)
    }

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? el.clientHeight : 1
      if (!raf) current = target = el.scrollTop
      target = Math.max(0, Math.min(target + e.deltaY * unit, el.scrollHeight - el.clientHeight))
      if (!raf) raf = requestAnimationFrame(step)
    }

    const onScroll = () => {
      if (!raf) current = target = el.scrollTop
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("scroll", onScroll)
    }
  }, [ref, enabled])
}
