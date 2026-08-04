import { ConfirmProvider, useConfirm } from "@sorbet/component-library";
import { useEffect } from "react";

// ConfirmProvider has no visual output of its own (like ThemeProvider /
// ToastProvider) — it renders one shared AlertDialog and hands out an
// imperative confirm() via context. To show ITS real rendered dialog, nest a
// provider around a small demo component that calls useConfirm() in a mount
// effect, exactly like a real call site (`if (await confirm({...}))`) would.

function DiscardChangesDemo() {
  const confirm = useConfirm();
  useEffect(() => {
    confirm({
      title: "Discard unsaved changes?",
      description: "You've edited this week's box lineup. Leaving now loses those changes.",
      confirmLabel: "Discard",
      cancelLabel: "Keep editing",
      tone: "danger",
    });
  }, [confirm]);
  return null;
}

export function Default() {
  return (
    <ConfirmProvider>
      <DiscardChangesDemo />
    </ConfirmProvider>
  );
}

function ArchiveBoardDemo() {
  const confirm = useConfirm();
  useEffect(() => {
    confirm({
      title: "Archive this board?",
      description: "Archived boards move out of the active list but can be restored anytime.",
      confirmLabel: "Archive board",
      cancelLabel: "Cancel",
      tone: "primary",
    });
  }, [confirm]);
  return null;
}

export function PrimaryTone() {
  return (
    <ConfirmProvider>
      <ArchiveBoardDemo />
    </ConfirmProvider>
  );
}
