import { Button, Kbd } from "@sorbet/component-library/atoms";
import { useTheme } from "@sorbet/component-library/core";
import { Cluster } from "@sorbet/component-library/layout";
import { useToast } from "@sorbet/component-library/molecules";
import { CommandPalette, type CommandItem } from "@sorbet/component-library/organisms";
import { useState } from "react";

import type { Demo } from "./types.ts";

/** ⌘K palette wired to real actions — grouped, with icons + shortcuts, one
 *  disabled item, and a trigger button. Press ⌘K (Ctrl+K) anywhere too. */
export function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const { set, toggle } = useTheme();
  const commands: CommandItem[] = [
    { id: "dash", label: "Go to Dashboard", group: "Navigate", icon: "📊", keywords: ["home"], onSelect: () => toast("Opened Dashboard") },
    { id: "settings", label: "Go to Settings", group: "Navigate", icon: "⚙️", onSelect: () => toast("Opened Settings") },
    { id: "profile", label: "Go to Profile", group: "Navigate", icon: "👤", onSelect: () => toast("Opened Profile") },
    { id: "new", label: "New project", description: "Create a blank project", group: "Actions", icon: "➕", shortcut: ["⌘", "N"], onSelect: () => toast("Creating project…", { tone: "success" }) },
    { id: "invite", label: "Invite teammate", group: "Actions", icon: "✉️", keywords: ["member", "add"], onSelect: () => toast("Invite sent") },
    { id: "archive", label: "Archive project", description: "Requires owner role", group: "Actions", icon: "🗄️", disabled: true, onSelect: () => {} },
    { id: "light", label: "Switch to light", group: "Theme", icon: "☀️", onSelect: () => set("light") },
    { id: "dark", label: "Switch to dark", group: "Theme", icon: "🌙", onSelect: () => set("dark") },
    { id: "toggle", label: "Toggle theme", group: "Theme", icon: "🌗", shortcut: ["⌘", "J"], onSelect: () => toggle() },
  ];
  return (
    <>
      <Cluster>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open command palette&nbsp;&nbsp;<Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </Button>
      </Cluster>
      <CommandPalette open={open} onOpenChange={setOpen} commands={commands} />
    </>
  );
}

export const demo: Demo = {
  title: "Command palette",
  layer: "organisms",
  order: 10,
  Component: CommandPaletteDemo,
};
