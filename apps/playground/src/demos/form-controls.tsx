import {
  Button,
  Checkbox,
  Choice,
  ColorInput,
  Input,
  NumberInput,
  Radio,
  Select,
  Switch,
  Textarea,
} from "@sorbet/component-library/atoms";
import { Grid, GridSpan2, Stack } from "@sorbet/component-library/layout";
import {
  Card,
  CardBody,
  CardFooter,
  Combobox,
  DatePicker,
  DateRange,
  Dropzone,
  Field,
  InputGroup,
  InputGroupAddon,
  MultiCombobox,
  type DateRangeValidation,
  type DateValidation,
} from "@sorbet/component-library/molecules";
import { useState } from "react";

import type { Demo } from "./types.ts";

const LABELS = [
  { value: "bug", label: "Bug", description: "Something is broken" },
  { value: "feature", label: "Feature", description: "New capability" },
  { value: "docs", label: "Docs", description: "Documentation only" },
  { value: "design", label: "Design", description: "Visual or UX work" },
  { value: "perf", label: "Performance" },
  { value: "a11y", label: "Accessibility" },
  { value: "breaking", label: "Breaking change", disabled: true },
];

const ASSIGNEES = [
  { value: "ada", label: "Ada Lovelace", description: "ada@sorbet.dev", group: "Engineering" },
  { value: "grace", label: "Grace Hopper", description: "grace@sorbet.dev", group: "Engineering" },
  { value: "alan", label: "Alan Turing", description: "alan@sorbet.dev", group: "Engineering", disabled: true },
  { value: "dieter", label: "Dieter Rams", description: "dieter@sorbet.dev", group: "Design" },
  { value: "susan", label: "Susan Kare", description: "susan@sorbet.dev", group: "Design" },
  { value: "don", label: "Don Norman", description: "don@sorbet.dev", group: "Design" },
  { value: "mary", label: "Mary Shelley", description: "mary@sorbet.dev", group: "Product" },
  { value: "ursula", label: "Ursula K. Le Guin", description: "ursula@sorbet.dev", group: "Product" },
];

/** DatePicker with live status wired through Field — masks as you type in
 *  mm/dd/yyyy and reports the two simple checks (valid + reasonable). */
function DatePickerDemo() {
  const [result, setResult] = useState<DateValidation | null>(null);
  const status: { hint?: string; error?: string } = !result || result.empty
    ? { hint: "Type digits — the slashes fill in for you." }
    : !result.complete
      ? { hint: "Keep typing…" }
      : !result.valid
        ? { error: "That's not a real calendar date." }
        : !result.inRange
          ? { error: "Pick a date between 1900 and 2100." }
          : { hint: `Looks good — ${result.date?.toLocaleDateString(undefined, { dateStyle: "full" })}.` };
  return (
    <Field label="Birthday" hint={status.hint} error={status.error} invalid={Boolean(status.error)}>
      <DatePicker format="mm/dd/yyyy" name="birthday" disableFuture onValueChange={(_, r) => setResult(r)} />
    </Field>
  );
}

/** DateRange with live status — pick a start day then an end day (or type into
 *  either input), no dates in the past, at least one night. */
function DateRangeDemo() {
  const [result, setResult] = useState<DateRangeValidation | null>(null);
  const status: { hint?: string; error?: string } = !result || !result.complete
    ? { hint: "Click a start day, then an end day — or type into either box." }
    : !result.start.valid || !result.end.valid
      ? { error: "One of those isn't a real calendar date." }
      : !result.ordered
        ? { error: "The start date must come before the end date." }
        : !result.spanOk
          ? { error: "The trip must be at least one night." }
          : { hint: `${result.nights} night${result.nights === 1 ? "" : "s"} booked.` };
  return (
    <Field label="Trip dates" hint={status.hint} error={status.error} invalid={Boolean(status.error)}>
      <DateRange format="mm/dd/yyyy" name="trip" disablePast minNights={1} onValueChange={(_, r) => setResult(r)} />
    </Field>
  );
}

export function FormControlsDemo() {
  return (
    <Card as="form" onSubmit={(e: React.SubmitEvent) => e.preventDefault()}>
      <CardBody>
        <Grid cols={2}>
          <Field label="Full name" hint="As it appears on your profile." required>
            <Input placeholder="Ada Lovelace" required />
          </Field>
          <Field label="Email" error="Enter a valid email address." invalid>
            <Input type="email" defaultValue="not-an-email" />
          </Field>
          <Field label="Role">
            <Select defaultValue="Engineer">
              <option>Engineer</option>
              <option>Designer</option>
              <option>Product</option>
            </Select>
          </Field>
          <Field label="Quantity" hint="± steppers, Arrow keys, hold to repeat. Clamps 1–99.">
            <NumberInput defaultValue={1} min={1} max={99} aria-label="Quantity" />
          </Field>
          <DatePickerDemo />
          <DateRangeDemo />
          <Field label="Brand color" hint="Click the swatch — SV square, hue/opacity, RGB, eyedropper.">
            <ColorInput defaultValue="#e35789" alpha />
          </Field>
          <Field label="Assignee" hint="Combobox — type to filter, arrows to navigate.">
            <Combobox options={ASSIGNEES} placeholder="Search people…" name="assignee" />
          </Field>
          <Field label="Labels" hint="Multi-select — Backspace removes the last tag.">
            <MultiCombobox options={LABELS} defaultValue={["bug", "docs"]} placeholder="Add labels…" name="labels" />
          </Field>
          <Field label="Website">
            <InputGroup>
              <InputGroupAddon>https://</InputGroupAddon>
              <Input placeholder="example.dev" />
              <Button>Check</Button>
            </InputGroup>
          </Field>
          <GridSpan2>
            <Field label="Bio" optional hint="Grows with content — field-sizing, no JS.">
              <Textarea autoResize placeholder="Tell us about yourself" />
            </Field>
          </GridSpan2>
          <GridSpan2>
            <Field label="Attachments" optional>
              <Dropzone
                name="attachments"
                multiple
                accept="image/*,.pdf"
                maxFiles={3}
                maxSize={1_048_576}
                hint="Images or PDF · up to 3 files · 1 MB each"
              />
            </Field>
          </GridSpan2>
          <Stack gap={2}>
            <Choice>
              <Checkbox defaultChecked /> Product updates
            </Choice>
            <Choice>
              <Checkbox indeterminate /> Weekly digest (mixed)
            </Choice>
            <Choice>
              <Checkbox disabled /> Spam (disabled)
            </Choice>
          </Stack>
          <Stack gap={2}>
            <Choice>
              <Radio name="plan" defaultChecked /> Free
            </Choice>
            <Choice>
              <Radio name="plan" /> Pro
            </Choice>
            <Choice>
              <Switch defaultChecked /> Marketing emails
            </Choice>
          </Stack>
        </Grid>
      </CardBody>
      <CardFooter>
        <Button variant="ghost" type="reset">
          Cancel
        </Button>
        <Button type="submit">Save changes</Button>
      </CardFooter>
    </Card>
  );
}

export const demo: Demo = { title: "Form controls", layer: "atoms", order: 30, Component: FormControlsDemo };
