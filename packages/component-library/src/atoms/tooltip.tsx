import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from "react";
import { createPortal } from "react-dom";

import { composeRefs } from "../core/index.ts";

const GAP = 8;

export interface TooltipProps {
  content: string;
  children: ReactElement<{
    ref?: Ref<HTMLElement>;
    "aria-describedby"?: string;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
  }>;
}

/**
 * Wraps a single focusable child; the tip renders as a manual popover in the
 * top layer, shown on hover and keyboard focus, wired via aria-describedby.
 */
export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const tip = tipRef.current;
    const anchor = anchorRef.current;
    if (!open || !tip || !anchor) {
      return;
    }
    tip.showPopover();
    const r = anchor.getBoundingClientRect();
    let left = r.left + r.width / 2 - tip.offsetWidth / 2;
    left = Math.min(Math.max(left, GAP), window.innerWidth - tip.offsetWidth - GAP);
    let top = r.top - tip.offsetHeight - GAP;
    if (top < GAP) {
      top = r.bottom + GAP;
    }
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    return () => tip.hidePopover();
  }, [open]);

  const child = children;
  return (
    <>
      {cloneElement(child, {
        ref: composeRefs<HTMLElement>(child.props.ref, anchorRef),
        "aria-describedby": open ? id : undefined,
        onMouseEnter: (e) => {
          child.props.onMouseEnter?.(e);
          show();
        },
        onMouseLeave: (e) => {
          child.props.onMouseLeave?.(e);
          hide();
        },
        onFocus: (e) => {
          child.props.onFocus?.(e);
          show();
        },
        onBlur: (e) => {
          child.props.onBlur?.(e);
          hide();
        },
        onKeyDown: (e) => {
          child.props.onKeyDown?.(e);
          if (e.key === "Escape") {
            hide();
          }
        },
      })}
      {open &&
        createPortal(
          <div id={id} ref={tipRef} className="sb-tooltip" popover="manual" role="tooltip">
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
