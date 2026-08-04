import { CommandTrigger } from "@sorbet/component-library";

// CommandTrigger is a plain search-shaped button (no popover of its own) that
// a real app wires to a CommandPalette's open state — it renders inline and
// never escapes the card grid, unlike the palette it opens.

export function Default() {
  return <CommandTrigger onClick={() => {}} />;
}

export function CustomLabel() {
  return <CommandTrigger label="Search orders, recipes, customers…" onClick={() => {}} />;
}

export function NoShortcutHint() {
  return <CommandTrigger label="Search" shortcutKey={null} onClick={() => {}} />;
}
