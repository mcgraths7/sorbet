import { Children, useEffect, useRef, useState, type ReactNode } from "react";

import { cx } from "../core/index.ts";

export type MarqueeGap = 2 | 3 | 4 | 6 | 8;

export interface MarqueeProps {
  /** Travel speed in pixels per second (default 40). Constant no matter how
   *  much content there is — the duration is derived from the measured width. */
  speed?: number;
  /** Travel right-to-left by default; `reverse` sends it the other way. */
  reverse?: boolean;
  gap?: MarqueeGap;
  /** Pause while the pointer is over it (default true). Focus always pauses. */
  pauseOnHover?: boolean;
  /** Soften the edges so content fades in and out rather than clipping. */
  fade?: boolean;
  /** Names the region for assistive tech. */
  "aria-label"?: string;
  pauseLabel?: string;
  resumeLabel?: string;
  className?: string;
  /** Any children — logos, chips, quotes. Each becomes one item in the loop. */
  children: ReactNode;
}

/**
 * An infinite scrolling row.
 *
 * The animation is pure CSS on a duplicated track, which is what keeps it
 * smooth: JS measures the content once (and again on resize), then hands CSS a
 * distance and a duration. Nothing moves pixels per frame, so the loop runs on
 * the compositor instead of competing with React for the main thread — the
 * usual reason hand-rolled marquees judder.
 *
 * Two details that make the loop convincing:
 * - The items are repeated enough times to overflow the container, and the
 *   track travels exactly one set's width before restarting. The next copy is
 *   already sitting where the last one was, so there's no seam and no jump.
 * - Duration is `distance / speed`, so a long list and a short list crawl at the
 *   same rate. A fixed duration would make more content scroll faster.
 *
 * Motion that runs on a loop is a WCAG 2.2.2 (Pause, Stop, Hide) obligation, so
 * pausing is built in rather than left to the caller: hover, focus, an explicit
 * toggle, and `prefers-reduced-motion` all stop it. Only the first set of items
 * is exposed to assistive tech; the copies are `aria-hidden`.
 */
export function Marquee({
  speed = 40,
  reverse,
  gap,
  pauseOnHover = true,
  fade = true,
  pauseLabel = "Pause scrolling",
  resumeLabel = "Resume scrolling",
  className,
  children,
  ...aria
}: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);
  const [copies, setCopies] = useState(2);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track || items.length === 0) {
      return;
    }

    const measure = () => {
      const children = [...track.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
      // Distance from an item to its own copy: one full set, gaps included.
      // Measuring the offset delta beats summing widths — no gap arithmetic.
      const first = children[0];
      const secondSet = children[items.length];
      if (!first || !secondSet) {
        return;
      }
      const distance = secondSet.offsetLeft - first.offsetLeft;
      if (distance <= 0) {
        return;
      }
      root.style.setProperty("--marquee-distance", `${distance}px`);
      root.style.setProperty("--marquee-duration", `${distance / speed}s`);
      // Enough sets to overflow the container, so the row never shows a hole
      // when the content is narrower than the viewport.
      const needed = Math.max(2, Math.ceil(root.clientWidth / distance) + 1);
      setCopies((current) => (current === needed ? current : needed));
    };

    // ResizeObserver delivers an initial callback on observe, so this covers the
    // first measurement too — no setState in the effect body.
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const child of track.children) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [items.length, speed, copies]);

  return (
    <div
      ref={rootRef}
      className={cx("sb-marquee", gap !== undefined && `sb-marquee--gap-${gap}`, fade && "sb-marquee--fade", className)}
      data-paused={paused || undefined}
      data-reverse={reverse || undefined}
      data-pause-on-hover={pauseOnHover || undefined}
      role="group"
      aria-label={aria["aria-label"]}
    >
      {/* Hidden until focused — the pause mechanism WCAG asks for, without
          putting chrome on a decorative row. Same trick as a skip link. */}
      <button type="button" className="sb-marquee__toggle" onClick={() => setPaused((p) => !p)}>
        {paused ? resumeLabel : pauseLabel}
      </button>

      <div ref={trackRef} className="sb-marquee__track">
        {Array.from({ length: copies }, (_, copy) =>
          items.map((item, i) => (
            <div
              key={`${copy}-${i}`}
              className="sb-marquee__item"
              // Only the first set is real content; the rest are visual filler.
              aria-hidden={copy > 0 || undefined}
            >
              {item}
            </div>
          )),
        )}
      </div>
    </div>
  );
}
