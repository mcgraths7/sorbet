import { composeRefs, cx } from "../core/index.ts";
import { useEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties } from "react";

export type MasonryGap = 2 | 3 | 4 | 6 | 8;

export interface MasonryProps extends ComponentPropsWithRef<"div"> {
  /** Minimum column width for the auto-fit layout, e.g. "12rem". */
  min?: string;
  /** Fixed column count instead of auto-fit. */
  cols?: 2 | 3 | 4 | 5;
  gap?: MasonryGap;
  /**
   * Upgrade to the DOM-order-preserving balanced grid (default). Set false to
   * stay on the zero-JS multi-column layout (column-major order).
   */
  balance?: boolean;
}

const ROW_HEIGHT = 2; // matches grid-auto-rows in _masonry.scss

/**
 * Pinterest-style masonry. Children are laid out as-is (Cards, Frames,
 * images…); no wrapper markup required. Without JS (or with balance={false})
 * it renders as CSS multi-columns; where the browser has native CSS masonry,
 * that wins and the balancer stands down.
 */
export function Masonry({ min, cols, gap, balance = true, className, style, ref, children, ...rest }: MasonryProps) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const [balanced, setBalanced] = useState(false);

  useEffect(() => {
    const container = localRef.current;
    if (!container || !balance) return;
    if (typeof CSS !== "undefined" && CSS.supports("grid-template-rows", "masonry")) return;

    setBalanced(true);

    const span = (item: HTMLElement) => {
      const gapPx = parseFloat(getComputedStyle(container).columnGap) || 0;
      const height = item.getBoundingClientRect().height;
      item.style.gridRowEnd = `span ${Math.max(1, Math.ceil((height + gapPx) / ROW_HEIGHT))}`;
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) span(entry.target as HTMLElement);
    });
    // Span synchronously first — no unbalanced first frame, no reliance on
    // the observer's initial delivery timing.
    for (const child of container.children) {
      if (child instanceof HTMLElement) span(child);
      resizeObserver.observe(child);
    }

    // React re-renders swap children in place; adopt what the observer misses.
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            resizeObserver.observe(node);
            span(node);
          }
        }
        for (const node of mutation.removedNodes) {
          if (node instanceof HTMLElement) resizeObserver.unobserve(node);
        }
      }
    });
    mutationObserver.observe(container, { childList: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      setBalanced(false);
    };
  }, [balance]);

  return (
    <div
      ref={composeRefs(ref, localRef)}
      className={cx(
        "sb-masonry",
        gap !== undefined && `sb-masonry--gap-${gap}`,
        cols && `sb-masonry--cols-${cols}`,
        balanced && "sb-masonry--balanced",
        className,
      )}
      style={min ? ({ "--min": min, ...style } as CSSProperties) : style}
      {...rest}
    >
      {children}
    </div>
  );
}
