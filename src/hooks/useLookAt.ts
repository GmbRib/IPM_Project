import { useEffect, type RefObject } from "react";

/**
 * Writes --lx / --ly (each in -1..1) on the element so CSS can point
 * its eyes at the cursor. The anchor sits near the top, where the head is.
 */
export function useLookAt(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height * 0.15);
        const len = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, len / 300);
        el.style.setProperty("--lx", ((dx / len) * reach).toFixed(3));
        el.style.setProperty("--ly", ((dy / len) * reach).toFixed(3));
      });
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}
