import { Button } from "../atoms/index.ts";
import { composeRefs, cx } from "../core/index.ts";
import { useEffect, useRef, type ComponentPropsWithRef, type CSSProperties } from "react";

export interface DrawerProps extends Omit<ComponentPropsWithRef<"dialog">, "onClose"> {
  open: boolean;
  onClose: () => void;
  /** Edge to slide from. */
  side?: "start" | "end";
  /** Panel width, e.g. "24rem". */
  width?: string;
  static?: boolean;
}

/** Edge-attached dialog: mobile nav, filter panels, detail peeks. */
export function Drawer({
  open,
  onClose,
  side = "end",
  width,
  static: isStatic,
  className,
  style,
  ref,
  children,
  ...rest
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={composeRefs(ref, dialogRef)}
      className={cx("sb-drawer", side === "start" && "sb-drawer--start", className)}
      style={width ? ({ "--drawer-size": width, ...style } as CSSProperties) : style}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current && !isStatic) dialogRef.current.close();
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
