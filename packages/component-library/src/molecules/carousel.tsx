import { Children, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { ChevronIcon } from "../atoms/index.ts";
import { cx, useControllableState } from "../core/index.ts";

export type CarouselGap = 2 | 3 | 4 | 6 | 8;

export interface CarouselProps {
  /** Controlled index of the active slide. */
  value?: number;
  /** Uncontrolled starting slide (default 0). */
  defaultValue?: number;
  onValueChange?: (index: number) => void;
  /** Slides visible at once (default 1). Fractional values peek the next one. */
  perView?: number;
  gap?: CarouselGap;
  /** Where a slide settles in the viewport (default "start"). */
  align?: "start" | "center";
  /** Prev/next buttons (default true). */
  controls?: boolean;
  /** Position dots (default true). */
  indicators?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  /** Names the carousel for assistive tech — always give it one. */
  "aria-label": string;
  className?: string;
  /** Any children: cards, quotes, images, whatever. Each becomes one slide. */
  children: ReactNode;
}

/**
 * A content-agnostic carousel built on CSS scroll snap: every child becomes a
 * slide, so testimonial cards, images, stat tiles or anything else work without
 * the component knowing what they are.
 *
 * The platform does the moving — native touch/trackpad swipe, momentum, and
 * keyboard scrolling come from the scroll container, and the stylesheet owns the
 * motion policy (so `prefers-reduced-motion` is honored without a JS branch).
 * We only track which slide is showing (IntersectionObserver) and scroll to one
 * on demand. No transforms, no timers, no cloned slides.
 *
 * Follows the ARIA "basic carousel" pattern: a labelled group whose slides are
 * announced as "N of M". Deliberately NOT a tablist — the slides are all present
 * and scrollable, which is not what tab semantics describe.
 */
export function Carousel({
  value,
  defaultValue,
  onValueChange,
  perView = 1,
  gap,
  align = "start",
  controls = true,
  indicators = true,
  previousLabel = "Previous slide",
  nextLabel = "Next slide",
  className,
  children,
  ...aria
}: CarouselProps) {
  const baseId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const slides = Children.toArray(children);
  const count = slides.length;

  const [active, setActive] = useControllableState(value, defaultValue ?? 0, onValueChange);
  const current = Math.min(Math.max(active, 0), Math.max(count - 1, 0));

  // Which slide is showing. The observer fires on scroll — including native
  // swipes we never see — so this stays true however the user got there.
  const [visible, setVisible] = useState(current);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const items = [...viewport.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) {
          return;
        }
        const index = items.indexOf(best.target as HTMLElement);
        if (index >= 0) {
          setVisible(index);
          setActive(index);
        }
      },
      { root: viewport, threshold: [0.5, 0.75, 1] },
    );
    for (const item of items) {
      observer.observe(item);
    }
    return () => observer.disconnect();
    // setActive is stable enough here; re-subscribing per slide count is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  /** Scroll a slide into place. `scrollTo` obeys the CSS scroll-behavior, so
   *  reduced-motion is decided in the stylesheet rather than branched here. */
  const scrollToSlide = (index: number) => {
    const viewport = viewportRef.current;
    const slide = viewport?.children[index];
    if (!viewport || !(slide instanceof HTMLElement)) {
      return;
    }
    // Relative offsets only — never scrolls the page, unlike scrollIntoView.
    viewport.scrollTo({ left: slide.offsetLeft - viewport.offsetLeft });
  };

  // Follow the controlled value when it's driven from outside.
  useEffect(() => {
    if (value != null && value !== visible) {
      scrollToSlide(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const atStart = visible <= 0;
  const atEnd = visible >= count - 1;

  return (
    <div
      className={cx("sb-carousel", gap !== undefined && `sb-carousel--gap-${gap}`, className)}
      style={{ "--per-view": perView } as CSSProperties}
      role="group"
      aria-roledescription="carousel"
      aria-label={aria["aria-label"]}
    >
      <div
        ref={viewportRef}
        id={`${baseId}-viewport`}
        className="sb-carousel__viewport"
        data-align={align}
        // Focusable so the scroll container is reachable by keyboard, which is
        // what makes arrow-key scrolling work without us implementing it.
        tabIndex={0}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="sb-carousel__slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
          >
            {slide}
          </div>
        ))}
      </div>

      {(controls || indicators) && count > 1 && (
        <div className="sb-carousel__controls">
          {controls && (
            <button
              type="button"
              className="sb-carousel__arrow"
              aria-label={previousLabel}
              aria-controls={`${baseId}-viewport`}
              disabled={atStart}
              onClick={() => scrollToSlide(visible - 1)}
            >
              <ChevronIcon direction="left" />
            </button>
          )}

          {indicators && (
            <div className="sb-carousel__dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="sb-carousel__dot"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === visible ? "true" : undefined}
                  aria-controls={`${baseId}-viewport`}
                  onClick={() => scrollToSlide(i)}
                />
              ))}
            </div>
          )}

          {controls && (
            <button
              type="button"
              className="sb-carousel__arrow"
              aria-label={nextLabel}
              aria-controls={`${baseId}-viewport`}
              disabled={atEnd}
              onClick={() => scrollToSlide(visible + 1)}
            >
              <ChevronIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
