"use client";

import { Children, isValidElement, useId, type ReactElement, type ReactNode } from "react";

import { Button } from "../atoms/index.ts";
import { cx, useControllableState } from "../core/index.ts";

import { Stepper } from "./stepper.tsx";

export interface WizardStepProps {
  label: ReactNode;
  description?: ReactNode;
  /** Custom step marker; defaults to the number (or a check when complete). */
  icon?: ReactNode;
  /** Gate: when false, the Next/Finish button is disabled on this step. Default true. */
  canAdvance?: boolean;
  children: ReactNode;
}

/**
 * Declares one step: its header label (for the Stepper) and its panel content.
 * Inert on its own — `Wizard` reads these props to build the flow.
 */
export function WizardStep(_: WizardStepProps): null {
  return null;
}

export interface WizardProps {
  /** Controlled active-step index. */
  value?: number;
  /** Uncontrolled initial step (default 0). */
  defaultValue?: number;
  onValueChange?: (index: number) => void;
  orientation?: "horizontal" | "vertical";
  backLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  /** Fires when Finish is pressed on the last step. */
  onFinish?: () => void;
  className?: string;
  children: ReactNode;
}

type StepEl = ReactElement<WizardStepProps>;

/**
 * A linear multi-step flow: builds its `Stepper` header from `WizardStep`
 * children, keeps every panel mounted (hidden when inactive, so entered data
 * survives Back/Next), and gates advancement per step via `canAdvance`. The
 * active step is the standard controlled/uncontrolled `value` seam.
 */
export function Wizard({
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  backLabel = "Back",
  nextLabel = "Next",
  finishLabel = "Finish",
  onFinish,
  className,
  children,
}: WizardProps) {
  const baseId = useId();
  const steps = Children.toArray(children).filter(
    (child): child is StepEl => isValidElement(child) && child.type === WizardStep,
  );

  const last = Math.max(steps.length - 1, 0);
  const [active, setActive] = useControllableState(value, defaultValue ?? 0, onValueChange);
  const clamped = Math.min(Math.max(active, 0), last);
  const isLast = clamped === last;
  const canAdvance = steps[clamped]?.props.canAdvance ?? true;

  const back = () => clamped > 0 && setActive(clamped - 1);
  const next = () => {
    if (!canAdvance) {
      return;
    }
    if (isLast) {
      onFinish?.();
    } else {
      setActive(clamped + 1);
    }
  };

  return (
    <div className={cx("sb-wizard", className)}>
      <Stepper
        orientation={orientation}
        current={clamped}
        steps={steps.map((s) => ({
          label: s.props.label,
          description: s.props.description,
          icon: s.props.icon,
        }))}
        onStepClick={(i) => i < clamped && setActive(i)}
      />

      <div className="sb-wizard__panels">
        {steps.map((step, i) => (
          <div
            key={i}
            id={`${baseId}-panel-${i}`}
            role="group"
            aria-label={typeof step.props.label === "string" ? step.props.label : undefined}
            className="sb-wizard__panel"
            hidden={i !== clamped}
          >
            {step.props.children}
          </div>
        ))}
      </div>

      <div className="sb-wizard__footer">
        <Button variant="ghost" onClick={back} disabled={clamped === 0}>
          {backLabel}
        </Button>
        <Button onClick={next} disabled={!canAdvance}>
          {isLast ? finishLabel : nextLabel}
        </Button>
      </div>
    </div>
  );
}
