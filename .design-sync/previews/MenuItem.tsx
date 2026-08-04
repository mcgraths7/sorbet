import { useEffect, useRef } from "react";
import { Button, Menu, MenuItem, MenuSeparator } from "@sorbet/component-library";

// Menu opens on native popovertarget invocation and has no `open` prop (unlike
// Popover/Tooltip). Firing a real click on the trigger right after mount opens
// it through the same code path a user click would, so the panel is visible
// for capture. See learnings for why this is needed.
function useOpenOnMount() {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.click();
  }, []);
  return ref;
}

export function Default() {
  const triggerRef = useOpenOnMount();
  return (
    <Menu trigger={<Button ref={triggerRef} variant="outline">Ava Thornton</Button>}>
      <MenuItem>View profile</MenuItem>
      <MenuItem>Account settings</MenuItem>
      <MenuItem>Billing</MenuItem>
    </Menu>
  );
}

export function WithShortcuts() {
  const triggerRef = useOpenOnMount();
  return (
    <Menu
      trigger={
        <Button ref={triggerRef} variant="secondary">
          Order #4821
        </Button>
      }
    >
      <MenuItem shortcut="⌘D">Duplicate order</MenuItem>
      <MenuItem shortcut="⌘P">Print packing slip</MenuItem>
      <MenuItem shortcut="⌘E">Edit delivery date</MenuItem>
    </Menu>
  );
}

export function Danger() {
  const triggerRef = useOpenOnMount();
  return (
    <Menu trigger={<Button ref={triggerRef} variant="outline">Recipe options</Button>}>
      <MenuItem>Duplicate recipe</MenuItem>
      <MenuItem>Move to collection</MenuItem>
      <MenuSeparator />
      <MenuItem danger>Delete recipe</MenuItem>
    </Menu>
  );
}
