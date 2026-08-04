import { CalendarIcon, CheckIcon, CommandPalette, PlusIcon, type CommandItem } from "@sorbet/component-library";

// CommandPalette renders a centered Modal (native <dialog>) internally, so a
// static `open` prop drives the real showModal() mount effect and the panel
// renders with its own filtering/grouping/keyboard-nav logic live — not a
// mocked look. It's a full-viewport top-layer overlay, so it's expected to
// escape the card grid — see learnings for the cardMode:"single" flag.

const opsCommands: CommandItem[] = [
  { id: "go-dashboard", label: "Go to Dashboard", group: "Navigate", shortcut: ["⌘", "1"], onSelect: () => {} },
  { id: "go-orders", label: "Go to Orders", group: "Navigate", shortcut: ["⌘", "2"], onSelect: () => {} },
  { id: "go-recipes", label: "Go to Recipes", group: "Navigate", shortcut: ["⌘", "3"], onSelect: () => {} },
  {
    id: "new-recipe",
    label: "Add new recipe",
    description: "Create a draft recipe to schedule into a future box",
    group: "Create",
    icon: <PlusIcon />,
    shortcut: ["⌘", "N"],
    onSelect: () => {},
  },
  {
    id: "schedule-delivery",
    label: "Schedule delivery window",
    group: "Create",
    icon: <CalendarIcon />,
    onSelect: () => {},
  },
  {
    id: "mark-shipped",
    label: "Mark order #4821 as shipped",
    group: "Actions",
    icon: <CheckIcon />,
    onSelect: () => {},
  },
  { id: "export-report", label: "Export weekly fulfillment report", group: "Actions", onSelect: () => {} },
  { id: "invite-teammate", label: "Invite a teammate", group: "Actions", disabled: true, onSelect: () => {} },
];

export function Default() {
  return (
    <CommandPalette open onOpenChange={() => {}} commands={opsCommands} label="Command palette" />
  );
}

export function CustomPlaceholder() {
  return (
    <CommandPalette
      open
      onOpenChange={() => {}}
      commands={opsCommands}
      placeholder="Search actions, orders, recipes…"
      label="Ops command palette"
    />
  );
}

export function Empty() {
  return (
    <CommandPalette
      open
      onOpenChange={() => {}}
      commands={[]}
      emptyMessage="No commands available right now"
      label="Command palette"
    />
  );
}
