import { cx } from "@sorbet/core";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
} from "react";

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<${component}> must be used inside <Tabs>`);
  return ctx;
}

export interface TabsProps extends Omit<ComponentPropsWithRef<"div">, "onChange"> {
  /** Controlled selected tab. */
  value?: string;
  /** Uncontrolled initial tab. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Segmented-control look. */
  pills?: boolean;
}

export function Tabs({ value, defaultValue, onValueChange, pills, className, children, ...rest }: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? "");
  const selected = value ?? internal;

  const setValue = useCallback(
    (v: string) => {
      setInternal(v);
      onValueChange?.(v);
    },
    [onValueChange],
  );

  return (
    <div className={cx("sb-tabs", pills && "sb-tabs--pills", className)} {...rest}>
      <TabsContext.Provider value={{ value: selected, setValue, baseId }}>{children}</TabsContext.Provider>
    </div>
  );
}

export function TabList({ className, onKeyDown, ...rest }: ComponentPropsWithRef<"div">) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    const list = e.currentTarget;
    const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]:not(:disabled)')];
    const current = tabs.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;
    const last = tabs.length - 1;
    let next: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = current === last ? 0 : current + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = current === 0 ? last : current - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    e.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  };

  return <div role="tablist" className={cx("sb-tabs__list", className)} onKeyDown={handleKeyDown} {...rest} />;
}

export interface TabProps extends ComponentPropsWithRef<"button"> {
  value: string;
}

export function Tab({ value, className, onClick, ...rest }: TabProps) {
  const ctx = useTabs("Tab");
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      className={cx("sb-tabs__tab", className)}
      onClick={(e) => {
        onClick?.(e);
        ctx.setValue(value);
      }}
      {...rest}
    />
  );
}

export interface TabPanelProps extends ComponentPropsWithRef<"div"> {
  value: string;
}

export function TabPanel({ value, className, ...rest }: TabPanelProps) {
  const ctx = useTabs("TabPanel");
  const selected = ctx.value === value;
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      hidden={!selected}
      className={cx("sb-tabs__panel", className)}
      {...rest}
    />
  );
}
