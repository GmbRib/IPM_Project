import { useEffect, type RefObject } from "react";

/**
 * Moves a fixed-position element towards the cursor with a little lag
 * (lerp per frame). Snaps straight to the cursor when reduced motion is on.
 */
export function useFollowCursor(ref: RefObject<HTMLElement | null>, ease = 0.18) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let frame = 0;
    let started = false;

    const render = () => {
      pos.x += (target.x - pos.x) * ease;
      pos.y += (target.y - pos.y) * ease;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      frame = Math.hypot(target.x - pos.x, target.y - pos.y) > 0.1 ? requestAnimationFrame(render) : 0;
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (reduce || !started) {
        // First move (or reduced motion): jump there instead of flying in from the corner.
        started = true;
        pos.x = target.x;
        pos.y = target.y;
      }
      if (!frame) frame = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [ref, ease]);
}
