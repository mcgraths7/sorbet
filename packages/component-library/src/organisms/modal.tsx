import { useEffect, useRef, type ComponentPropsWithRef, type ReactNode } from "react";

import { Button } from "../atoms/index.ts";
import { composeRefs, cx } from "../core/index.ts";

export interface ModalProps extends Omit<ComponentPropsWithRef<"dialog">, "onClose"> {
  open: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
  /** Disables light dismiss (clicking the backdrop). */
  static?: boolean;
}

/**
 * Native <dialog> opened with showModal(): focus trap, Escape, ::backdrop and
 * top-layer stacking come from the platform. Entry/exit animations come from
 * the stylesheet's @starting-style rules.
 */
export function Modal({ open, onClose, size = "md", static: isStatic, className, ref, children, ...rest }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={composeRefs(ref, dialogRef)}
      className={cx("sb-modal", size !== "md" && `sb-modal--${size}`, className)}
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

export interface ModalHeaderProps extends ComponentPropsWithRef<"header"> {
  /** Renders the × close button wired to this handler. */
  onClose?: () => void;
  closeLabel?: string;
}

export function ModalHeader({ onClose, closeLabel = "Close", className, children, ...rest }: ModalHeaderProps) {
  return (
    <header className={cx("sb-modal__header", className)} {...rest}>
      {children}
      {onClose && (
        <Button variant="ghost" size="sm" iconOnly aria-label={closeLabel} onClick={onClose}>
          ×
        </Button>
      )}
    </header>
  );
}

export function ModalBody({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-modal__body", className)} {...rest} />;
}

export function ModalFooter({ className, ...rest }: ComponentPropsWithRef<"footer">) {
  return <footer className={cx("sb-modal__footer", className)} {...rest} />;
}

export type { ReactNode as ModalChildren };
