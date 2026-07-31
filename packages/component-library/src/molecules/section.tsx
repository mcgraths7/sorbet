import { Heading, Lead } from "../atoms/index.ts";
import { cx } from "../core/index.ts";

import type { HeadingLevel } from "../atoms/index.ts";
import type { ComponentPropsWithRef, ReactNode } from "react";

export type SectionGap = 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16;

export interface SectionProps extends Omit<ComponentPropsWithRef<"section">, "title"> {
  /** Section heading. Omit for an unlabelled block. */
  title?: ReactNode;
  /** Supporting line under the title. */
  description?: ReactNode;
  /** Trailing control on the title row — a "See all" button, a filter, a link. */
  action?: ReactNode;
  /** Heading tag level (default 2). Appearance stays constant; this is semantics. */
  level?: HeadingLevel;
  /** Space between the header and the body, and between body children (default 6). */
  gap?: SectionGap;
}

/**
 * A titled page section: heading, optional description and trailing action,
 * then whatever you put inside.
 *
 * This is the shape every landing page repeats — a `<section>` wrapping a
 * heading, a line of supporting text, sometimes a control on the right, then
 * the content. Writing it by hand each time meant re-deciding the heading
 * level, the gap and whether the description was a `Lead` or muted `Text`,
 * which is how a page ends up subtly inconsistent with itself.
 *
 *   <Section title="This week's menu" description="Rotating every Monday."
 *            action={<Button>See all</Button>} id="menu">
 *     <Grid cols={3}>…</Grid>
 *   </Section>
 *
 * The description is always a `Lead` — that component exists for exactly this
 * role, and picking one keeps sections looking like siblings. For quieter text,
 * leave `description` off and put your own in the body.
 */
export function Section({
  title,
  description,
  action,
  level = 2,
  gap,
  className,
  children,
  ...rest
}: SectionProps) {
  const hasHeader = title != null || description != null || action != null;
  return (
    <section className={cx("sb-section", gap !== undefined && `sb-section--gap-${gap}`, className)} {...rest}>
      {hasHeader && (
        <header className="sb-section__header">
          <div className="sb-section__intro">
            {title != null && <Heading level={level}>{title}</Heading>}
            {description != null && <Lead>{description}</Lead>}
          </div>
          {action != null && <div className="sb-section__action">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
