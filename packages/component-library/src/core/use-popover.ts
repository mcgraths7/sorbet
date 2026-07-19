/**
 * Shared popover plumbing. Every Sorbet flyout (menu, combobox, date + color
 * pickers, the generic Popover) is a top-layer element that has to be anchored
 * to its trigger by hand and dismissed when the page scrolls out from under it.
 * `positionPopover` is the placement math; `usePopover` is the manual-popover
 * lifecycle (mirror `open` to show/hide, anchor, dismiss on outside press or
 * scroll). Lives in core so both atoms and molecules can reach it.
 */

import { useEffect, useRef, type RefObject, type ToggleEvent } from "react";

const GAP = 6;
const EDGE = 8;

export interface PopoverPlacement {
  /** Align the panel's inline-end to the trigger's (default: inline-start). */
  alignEnd?: boolean;
  /** Set the panel's min width to the trigger width (combobox-style). */
  matchWidth?: boolean;
  /** With matchWidth, cap max width at max(triggerWidth, widthFloor). */
  widthFloor?: number;
  /** Space between trigger and panel (px). */
  gap?: number;
  /** Minimum distance kept from the viewport edge (px). */
  edge?: number;
}

/**
 * Place a fixed-position `panel` just under `anchor`, flipping above when there
 * isn't room below, and clamp it inside the viewport.
 */
export function positionPopover(anchor: HTMLElement, panel: HTMLElement, opts: PopoverPlacement = {}): void {
  const gap = opts.gap ?? GAP;
  const edge = opts.edge ?? EDGE;
  const r = anchor.getBoundingClientRect();
  if (opts.matchWidth) {
    panel.style.minInlineSize = `${r.width}px`;
    if (opts.widthFloor != null) {
      panel.style.maxInlineSize = `${Math.max(r.width, opts.widthFloor)}px`;
    }
  }
  const w = panel.offsetWidth;
  const h = panel.offsetHeight;
  let left = opts.alignEnd ? r.right - w : r.left;
  left = Math.min(Math.max(left, edge), Math.max(edge, window.innerWidth - w - edge));
  let top = r.bottom + gap;
  if (top + h > window.innerHeight - edge) {
    top = Math.max(r.top - h - gap, edge);
  }
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

export interface UsePopoverOptions extends PopoverPlacement {
  open: boolean;
  /** How the hook asks to close — outside press, outside scroll, or an
   *  external hide (Escape on an auto popover, a programmatic hidePopover). */
  onDismiss: () => void;
}

export interface UsePopoverResult<A extends HTMLElement, P extends HTMLElement> {
  /** Attach to the trigger/control the panel anchors to. */
  anchorRef: RefObject<A | null>;
  /** Attach to the popover panel. */
  panelRef: RefObject<P | null>;
  /** Spread onto the panel: `popover="manual"` + a close safety net. */
  popoverProps: { popover: "manual"; onToggle: (event: ToggleEvent<P>) => void };
  /** Re-anchor the panel — call after its content changes size. */
  reposition: () => void;
}

/**
 * The manual-popover lifecycle the pickers and generic Popover share. The
 * component keeps owning `open` (it usually drives other state too); the hook
 * mirrors it to the platform and calls `onDismiss` when the user's action
 * should close it.
 */
export function usePopover<A extends HTMLElement = HTMLDivElement, P extends HTMLElement = HTMLDivElement>(
  options: UsePopoverOptions,
): UsePopoverResult<A, P> {
  const { open, onDismiss, alignEnd, matchWidth, widthFloor, gap, edge } = options;
  const placement: PopoverPlacement = { alignEnd, matchWidth, widthFloor, gap, edge };

  const anchorRef = useRef<A | null>(null);
  const panelRef = useRef<P | null>(null);
  // Keep the latest onDismiss without re-subscribing listeners every render.
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const reposition = () => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (anchor && panel && panel.matches(":popover-open")) {
      positionPopover(anchor, panel, placement);
    }
  };

  // Mirror `open` to the platform and anchor the panel when it appears.
  useEffect(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!panel || !anchor) {
      return;
    }
    if (open && !panel.matches(":popover-open")) {
      panel.showPopover();
      positionPopover(anchor, panel, placement);
    } else if (!open && panel.matches(":popover-open")) {
      panel.hidePopover();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Manual popovers don't light-dismiss; a fixed panel can't follow scroll.
  // Close on an outside press, or on any scroll outside the panel (capture
  // phase, since scroll doesn't bubble — panel-internal scroll is exempt).
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!anchorRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        dismissRef.current();
      }
    };
    const onScroll = (e: Event) => {
      if (!panelRef.current?.contains(e.target as Node)) {
        dismissRef.current();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [open]);

  const popoverProps = {
    popover: "manual" as const,
    onToggle: (event: ToggleEvent<P>) => {
      if (event.newState === "closed" && open) {
        dismissRef.current();
      }
    },
  };

  return { anchorRef, panelRef, popoverProps, reposition };
}
