import { useEffect, useRef, type ComponentPropsWithRef, type CSSProperties } from "react";

import { Button } from "../atoms/index.ts";
import { composeRefs, cx } from "../core/index.ts";

export interface DrawerProps extends Omit<ComponentPropsWithRef<"dialog">, "onClose"> {
  open: boolean;
  onClose: () => void;
  /** Edge to slide from. */
  side?: "start" | "end";
  /** Panel width, e.g. "24rem". */
  width?: string;
  static?: boolean;
  /** Non-modal: no scrim, page stays interactive (dev panels, inspectors). */
  modeless?: boolean;
}

/** Edge-attached dialog: mobile nav, filter panels, detail peeks. */
export function Drawer({
  open,
  onClose,
  side = "end",
  width,
  static: isStatic,
  modeless,
  className,
  style,
  ref,
  children,
  ...rest
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  // Keep the latest onClose without re-subscribing the light-dismiss listener.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open) {
      delete dialog.dataset.closing;
      if (!dialog.open) {
        if (modeless) {
          dialog.show();
        } else {
          dialog.showModal();
        }
      }
      return;
    }

    // Closing. Modal dialogs animate out natively — they stay painted in the
    // top layer via `overlay`. Modeless ones don't, so slide the panel out
    // ourselves (via [data-closing]) and only call close() once it finishes.
    if (!dialog.open) {
      return;
    }
    if (!modeless) {
      dialog.close();
      return;
    }

    dialog.dataset.closing = "";
    let closed = false;
    const finish = () => {
      if (closed) {
        return;
      }
      closed = true;
      if (dialog.open) {
        dialog.close();
      }
      delete dialog.dataset.closing;
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.target === dialog && e.propertyName === "translate") {
        finish();
      }
    };
    dialog.addEventListener("transitionend", onEnd);
    // Fallback when the transition is skipped (reduced motion / zero duration).
    const timer = window.setTimeout(finish, 600);
    return () => {
      dialog.removeEventListener("transitionend", onEnd);
      window.clearTimeout(timer);
    };
  }, [open, modeless]);

  // Modeless drawers have no backdrop to click; light-dismiss on any press
  // outside the panel instead (unless `static`). Route through onClose so the
  // close animation runs, rather than snapping shut via dialog.close().
  useEffect(() => {
    if (!open || !modeless || isStatic) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const dialog = dialogRef.current;
      if (dialog?.open && !dialog.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, modeless, isStatic]);

  return (
    <dialog
      ref={composeRefs(ref, dialogRef)}
      className={cx("sb-drawer", side === "start" && "sb-drawer--start", className)}
      style={width ? ({ "--drawer-size": width, ...style } as CSSProperties) : style}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current && !isStatic) {
          dialogRef.current.close();
        }
      }}
      {...rest}
    >
      {children}
    </dialog>
  );
}

export interface DrawerHeaderProps extends ComponentPropsWithRef<"header"> {
  onClose?: () => void;
  closeLabel?: string;
}

export function DrawerHeader({ onClose, closeLabel = "Close", className, children, ...rest }: DrawerHeaderProps) {
  return (
    <header className={cx("sb-drawer__header", className)} {...rest}>
      {children}
      {onClose && (
        <Button variant="ghost" size="sm" iconOnly aria-label={closeLabel} onClick={onClose}>
          ×
        </Button>
      )}
    </header>
  );
}

export function DrawerBody({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-drawer__body", className)} {...rest} />;
}

export function DrawerFooter({ className, ...rest }: ComponentPropsWithRef<"footer">) {
  return <footer className={cx("sb-drawer__footer", className)} {...rest} />;
}
