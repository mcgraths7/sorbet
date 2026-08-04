import { AlertDialog, Text } from "@sorbet/component-library";

// AlertDialog is built on Modal (a native <dialog>), so a static `open` prop
// drives the real showModal() mount effect — genuine top-layer chrome, not a
// mocked look-alike. Same real-code-path technique as Modal/Drawer/Popover.
// A real open dialog escapes the card grid into a full-viewport scrim — see
// learnings for the cardMode:"single" flag.

export function Danger() {
  return (
    <AlertDialog
      open
      onOpenChange={() => {}}
      tone="danger"
      title="Delete this project?"
      description="This permanently deletes “Meal Kit — Ops Dashboard” and all of its boards. This can't be undone."
      confirmLabel="Delete project"
      cancelLabel="Cancel"
    />
  );
}

export function Primary() {
  return (
    <AlertDialog
      open
      onOpenChange={() => {}}
      tone="primary"
      title="Publish this recipe?"
      description="It'll appear in next week's box lineup and customers will be able to add it right away."
      confirmLabel="Publish"
      cancelLabel="Not yet"
    />
  );
}

export function CustomBody() {
  return (
    <AlertDialog open onOpenChange={() => {}} tone="danger" title="Remove Priya Nair from this team?" confirmLabel="Remove member" cancelLabel="Keep member">
      <Text tone="muted">
        They'll lose access to all shared boards immediately. Any orders assigned to them will be
        reassigned to the team owner.
      </Text>
    </AlertDialog>
  );
}
