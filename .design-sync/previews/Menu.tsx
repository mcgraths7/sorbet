import { Button, Menu, MenuItem, MenuSeparator } from "@sorbet/component-library";
import { useEffect, useRef } from "react";

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
      <MenuSeparator />
      <MenuItem danger>Sign out</MenuItem>
    </Menu>
  );
}

export function AlignEnd() {
  const triggerRef = useOpenOnMount();
  return (
    <Menu
      trigger={
        <Button ref={triggerRef} variant="secondary">
          Order #4821
        </Button>
      }
      alignEnd
    >
      <MenuItem shortcut="⌘D">Duplicate order</MenuItem>
      <MenuItem shortcut="⌘P">Print packing slip</MenuItem>
      <MenuSeparator />
      <MenuItem danger>Cancel order</MenuItem>
    </Menu>
  );
}
