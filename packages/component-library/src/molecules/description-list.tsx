import { cx } from "../core/index.ts";

import type { ComponentPropsWithRef, ReactNode } from "react";

/**
 * How the pairs are arranged.
 * - `stacked` (default): term above its value. Safest on narrow screens.
 * - `inline`: term left, value hard right — the receipt/order-summary shape.
 */
export type DescriptionLayout = "stacked" | "inline";

export interface DescriptionListProps extends ComponentPropsWithRef<"dl"> {
  layout?: DescriptionLayout;
  /** Rules between pairs, for longer runs where the eye needs help. */
  divided?: boolean;
}

/**
 * Term/value pairs. Use for labelled facts — a nutrition panel, a spec sheet,
 * an order summary, a metadata block.
 *
 * Prefer this over a two-column Table: key-value facts have no meaningful
 * second axis, so a table's row/column semantics describe them wrongly and
 * force a horizontal scroll on a phone. Prefer Stat over this for a small
 * number of headline metrics that want visual weight.
 */
export function DescriptionList({ layout = "stacked", divided, className, ...rest }: DescriptionListProps) {
  return (
    <dl
      className={cx(
        "sb-description-list",
        layout !== "stacked" && `sb-description-list--${layout}`,
        divided && "sb-description-list--divided",
        className,
      )}
      {...rest}
    />
  );
}

export interface DescriptionItemProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  term: ReactNode;
  children: ReactNode;
}

/**
 * One pair. The wrapping <div> is valid inside <dl> and is what lets each pair
 * lay out as a unit; without it the terms and values are one flat run.
 *
 * For the rarer shapes — one term with several values, or a value with no
 * term — drop to DescriptionTerm/DescriptionDetail directly.
 */
export function DescriptionItem({ term, children, className, ...rest }: DescriptionItemProps) {
  return (
    <div className={cx("sb-description-list__item", className)} {...rest}>
      <DescriptionTerm>{term}</DescriptionTerm>
      <DescriptionDetail>{children}</DescriptionDetail>
    </div>
  );
}

/** The label half of a pair. */
export function DescriptionTerm({ className, ...rest }: ComponentPropsWithRef<"dt">) {
  return <dt className={cx("sb-description-list__term", className)} {...rest} />;
}

/** The value half of a pair. Several may follow one term. */
export function DescriptionDetail({ className, ...rest }: ComponentPropsWithRef<"dd">) {
  return <dd className={cx("sb-description-list__detail", className)} {...rest} />;
}
