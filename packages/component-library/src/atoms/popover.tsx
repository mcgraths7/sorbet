import {
  cloneElement,
  useEffect,
  useId,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import { chain, composeRefs, cx, useControllableState, usePopover } from "../core/index.ts";

export interface PopoverProps {
  /** The trigger — must render a real focusable element (e.g. atoms' Button). */
  trigger: ReactElement<{
    ref?: Ref<HTMLElement>;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
    "aria-haspopup"?: "dialog";
    "aria-expanded"?: boolean;
  }>;
  children: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Align the panel's inline-end to the trigger's (default: inline-start). */
  alignEnd?: boolean;
  className?: string;
  /** Accessible name for the panel (it's a dialog). */
  "aria-label"?: string;
}

/**
 * Anchored panel of arbitrary content on the Popover API — the generic version
 * of the machinery the menu and pickers use. Click the trigger to toggle; an
 * outside press, an outside scroll, or Escape dismisses. Uncontrolled by
 * default; pass `open` + `onOpenChange` to control it.
 */
export function Popover({
  trigger,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  alignEnd,
  className,
  ...aria
}: PopoverProps) {
  const id = useId();
  const [open, setOpen] = useControllableState(openProp, defaultOpen, onOpenChange);

  const { anchorRef, panelRef, popoverProps } = usePopover<HTMLElement, HTMLDivElement>({
    open,
    onDismiss: () => setOpen(false),
    alignEnd,
  });

  // Focus the panel when it opens so Escape works and assistive tech lands
  // inside the dialog.
  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dismissToTrigger = () => {
    setOpen(false);
    anchorRef.current?.focus();
  };

  return (
    <>
      {cloneElement(trigger, {
        ref: composeRefs<HTMLElement>(trigger.props.ref, anchorRef),
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        onClick: chain(trigger.props.onClick, () => setOpen(!open)),
      })}
      <div
        id={id}
        ref={panelRef}
        role="dialog"
        aria-label={aria["aria-label"]}
        tabIndex={-1}
        className={cx("sb-popover", className)}
        {...popoverProps}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Escape") {
            event.preventDefault();
            dismissToTrigger();
          }
        }}
      >
        {children}
      </div>
    </>
  );
}
