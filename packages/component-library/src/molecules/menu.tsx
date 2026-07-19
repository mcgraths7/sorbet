import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type ToggleEvent,
} from "react";

import { composeRefs, cx, positionPopover } from "../core/index.ts";

export interface MenuProps {
  /** The trigger element — must render a real <button> (e.g. atoms' Button). */
  trigger: ReactElement<{
    ref?: Ref<HTMLElement>;
    popoverTarget?: string;
    "aria-haspopup"?: React.AriaAttributes["aria-haspopup"];
  }>;
  /** Align the panel to the trigger's inline end. */
  alignEnd?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Dropdown on the Popover API: the platform provides top-layer rendering,
 * light dismiss and Escape; this adds positioning and arrow-key navigation.
 */
export function Menu({ trigger, alignEnd, className, children }: MenuProps) {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const items = () =>
    [...(panelRef.current?.querySelectorAll<HTMLElement>(".sb-menu__item:not(:disabled)") ?? [])];

  // The panel is position:fixed and can't track its trigger through page
  // scroll — dismiss instead (scrolling inside the panel is exempt).
  useEffect(() => {
    if (!open) {
      return;
    }
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) {
        return;
      }
      panelRef.current?.hidePopover();
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, [open]);

  const onToggle = (e: ToggleEvent<HTMLDivElement>) => {
    const isOpen = e.newState === "open";
    setOpen(isOpen);
    if (!isOpen || !panelRef.current || !triggerRef.current) {
      return;
    }
    positionPopover(triggerRef.current, panelRef.current, { alignEnd });
    items()[0]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const current = list.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        list[(current + 1) % list.length]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        list[current <= 0 ? list.length - 1 : current - 1]?.focus();
        break;
      case "Home":
        e.preventDefault();
        list[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        list[list.length - 1]?.focus();
        break;
      case "Tab":
        panelRef.current?.hidePopover();
        break;
    }
  };

  return (
    <>
      {cloneElement(trigger, {
        ref: composeRefs<HTMLElement>(trigger.props.ref, triggerRef),
        popoverTarget: id,
        "aria-haspopup": "menu",
      })}
      <div
        id={id}
        ref={panelRef}
        popover=""
        className={cx("sb-menu", className)}
        onToggle={onToggle}
        onKeyDown={onKeyDown}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".sb-menu__item")) {
            panelRef.current?.hidePopover();
            triggerRef.current?.focus();
          }
        }}
      >
        {children}
      </div>
    </>
  );
}

export interface MenuItemProps extends Omit<ComponentPropsWithRef<"button">, "onSelect"> {
  danger?: boolean;
  /** Right-aligned shortcut hint. */
  shortcut?: ReactNode;
  onSelect?: () => void;
}

export function MenuItem({ danger, shortcut, onSelect, className, children, onClick, ...rest }: MenuItemProps) {
  return (
    <button
      type="button"
      className={cx("sb-menu__item", className)}
      data-danger={danger || undefined}
      onClick={(e) => {
        onClick?.(e);
        onSelect?.();
      }}
      {...rest}
    >
      {children}
      {shortcut && <span className="sb-menu__kbd">{shortcut}</span>}
    </button>
  );
}

export function MenuHeading({ className, ...rest }: ComponentPropsWithRef<"p">) {
  return <p className={cx("sb-menu__heading", className)} {...rest} />;
}

export function MenuSeparator({ className, ...rest }: ComponentPropsWithRef<"hr">) {
  return <hr className={cx("sb-menu__separator", className)} {...rest} />;
}
