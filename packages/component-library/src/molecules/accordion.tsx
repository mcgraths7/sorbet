import { useId, type ComponentPropsWithRef, type ReactNode } from "react";

import { cx } from "../core/index.ts";

export interface AccordionProps extends ComponentPropsWithRef<"div"> {
  /** Exclusive-open group (native <details name>). Defaults to a unique group. */
  name?: string;
  exclusive?: boolean;
}

/** Group wrapper for AccordionItems. Native details/summary — zero JS state. */
export function Accordion({ name, exclusive = true, className, children, ...rest }: AccordionProps) {
  const autoName = useId();
  const groupName = exclusive ? (name ?? autoName) : undefined;
  return (
    <div className={cx("sb-accordion-group", className)} data-accordion-name={groupName} {...rest}>
      {children}
    </div>
  );
}

export interface AccordionItemProps extends Omit<ComponentPropsWithRef<"details">, "title"> {
  summary: ReactNode;
  /** Group name — set automatically when rendered as Accordion children via
   * the `name` prop; pass explicitly when using items standalone. */
  name?: string;
  defaultOpen?: boolean;
}

export function AccordionItem({ summary, name, defaultOpen, className, children, ...rest }: AccordionItemProps) {
  return (
    <details className={cx("sb-accordion", className)} name={name} open={defaultOpen} {...rest}>
      <summary>{summary}</summary>
      <div className="sb-accordion__body">{children}</div>
    </details>
  );
}
