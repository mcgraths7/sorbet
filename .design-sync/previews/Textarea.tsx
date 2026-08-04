import { Field, Textarea } from "@sorbet/component-library";

export function Default() {
  return (
    <Field label="Order notes" hint="Visible to the kitchen team only.">
      <Textarea rows={4} placeholder="Leave the delivery at the side door…" style={{ width: 280 }} />
    </Field>
  );
}

export function AutoResize() {
  return (
    <Textarea
      autoResize
      defaultValue={"Hey team,\n\nThe Tuesday batch is running a little behind — new ETA is 6:30pm.\n\nThanks for your patience!"}
      style={{ width: 280 }}
      aria-label="Message"
    />
  );
}

export function States() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 280 }}>
      <Textarea rows={3} defaultValue="This delivery window doesn't work for me." invalid aria-label="Feedback, invalid" />
      <Textarea rows={3} defaultValue="Locked for review." disabled aria-label="Feedback, disabled" />
    </div>
  );
}
