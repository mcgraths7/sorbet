"use client";

import { type ReactNode } from "react";

import { CheckIcon } from "../atoms/index.ts";
import { cx } from "../core/index.ts";

export interface StepItem {
  label: ReactNode;
  description?: ReactNode;
  /** Custom marker content; defaults to the 1-based number (or a check when complete). */
  icon?: ReactNode;
}

export interface StepperProps {
  steps: StepItem[];
  /** Zero-based index of the active step. Earlier steps read as complete, later as upcoming. */
  current: number;
  orientation?: "horizontal" | "vertical";
  /**
   * Makes complete/current steps clickable (upcoming stays inert), for a
   * navigable flow. Omit for a read-only progress indicator.
   */
  onStepClick?: (index: number) => void;
  className?: string;
}

type Status = "complete" | "current" | "upcoming";

/**
 * A presentational step indicator: an ordered list of markers with
 * complete / current / upcoming states, connected by a rail. Pure display —
 * pass `current` and, for a navigable flow, `onStepClick`. It carries no state
 * and works standalone (checkout, onboarding) or as a `Wizard`'s header.
 */
export function Stepper({ steps, current, orientation = "horizontal", onStepClick, className }: StepperProps) {
  return (
    <ol className={cx("sb-stepper", `sb-stepper--${orientation}`, className)}>
      {steps.map((step, i) => {
        const status: Status = i < current ? "complete" : i === current ? "current" : "upcoming";
        const navigable = onStepClick != null && status !== "upcoming";
        const marker = status === "complete" ? <CheckIcon /> : (step.icon ?? i + 1);

        const body = (
          <>
            <span className="sb-stepper__marker" aria-hidden="true">
              {marker}
            </span>
            <span className="sb-stepper__text">
              <span className="sb-stepper__label">{step.label}</span>
              {step.description != null && <span className="sb-stepper__desc">{step.description}</span>}
            </span>
          </>
        );

        return (
          <li
            key={i}
            className="sb-stepper__step"
            data-status={status}
            aria-current={status === "current" ? "step" : undefined}
          >
            {navigable ? (
              <button type="button" className="sb-stepper__button" onClick={() => onStepClick(i)}>
                {body}
              </button>
            ) : (
              <span className="sb-stepper__button">{body}</span>
            )}
            {i < steps.length - 1 && <span className="sb-stepper__connector" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
