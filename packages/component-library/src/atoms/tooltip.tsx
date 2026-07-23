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

import { chain, composeRefs, positionPopover } from "../core/index.ts";

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
    positionPopover(anchor, tip, { center: true, above: true, gap: 8 });
    return () => tip.hidePopover();
  }, [open]);

  const child = children;
  return (
    <>
      {cloneElement(child, {
        ref: composeRefs<HTMLElement>(child.props.ref, anchorRef),
        "aria-describedby": open ? id : undefined,
        onMouseEnter: chain(child.props.onMouseEnter, show),
        onMouseLeave: chain(child.props.onMouseLeave, hide),
        onFocus: chain(child.props.onFocus, show),
        onBlur: chain(child.props.onBlur, hide),
        onKeyDown: chain(child.props.onKeyDown, (e: React.KeyboardEvent) => {
          if (e.key === "Escape") {
            hide();
          }
        }),
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
