import { cx } from "@sorbet/core";
import type { ComponentPropsWithRef, ReactNode } from "react";

export function Footer({ className, children, ...rest }: ComponentPropsWithRef<"footer">) {
  return (
    <footer className={cx("sb-footer", className)} {...rest}>
      <div className="sb-container sb-footer__inner">{children}</div>
    </footer>
  );
}

export function FooterCols({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-footer__cols", className)} {...rest} />;
}

export interface FooterColProps extends ComponentPropsWithRef<"div"> {
  heading?: ReactNode;
}

export function FooterCol({ heading, className, children, ...rest }: FooterColProps) {
  return (
    <div className={className} {...rest}>
      {heading && <p className="sb-footer__heading">{heading}</p>}
      <ul>{children}</ul>
    </div>
  );
}

export function FooterMeta({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-footer__meta", className)} {...rest} />;
}
