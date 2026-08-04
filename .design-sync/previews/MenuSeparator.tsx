import { useEffect, useRef } from "react";
import { Button, Menu, MenuHeading, MenuItem, MenuSeparator } from "@sorbet/component-library";

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

export function GroupedSections() {
  const triggerRef = useOpenOnMount();
  return (
    <Menu trigger={<Button ref={triggerRef} variant="outline">Sort &amp; filter</Button>}>
      <MenuHeading>Sort by</MenuHeading>
      <MenuItem>Newest first</MenuItem>
      <MenuItem>Price: low to high</MenuItem>
      <MenuSeparator />
      <MenuHeading>Filter by status</MenuHeading>
      <MenuItem>Delivered</MenuItem>
      <MenuItem>In transit</MenuItem>
      <MenuSeparator />
      <MenuItem>Clear filters</MenuItem>
    </Menu>
  );
}
