import { Button, Drawer, DrawerBody, DrawerFooter, DrawerHeader, Text } from "@sorbet/component-library";

// DrawerHeader only makes sense inside an open Drawer, so each card composes
// the full panel. This card's focus is the header row itself: the title slot
// plus the wired × close button (rendered only when `onClose` is given).

export function Default() {
  return (
    <Drawer open onClose={() => {}} aria-labelledby="dheader-default-title">
      <DrawerHeader onClose={() => {}}>
        <Text id="dheader-default-title" weight="semibold" size="lg">
          Customer details
        </Text>
      </DrawerHeader>
      <DrawerBody>
        <Text tone="muted">Priya Nair — 14 orders, member since March.</Text>
      </DrawerBody>
      <DrawerFooter>
        <Button variant="primary">View full profile</Button>
      </DrawerFooter>
    </Drawer>
  );
}

export function NoCloseButton() {
  return (
    <Drawer open onClose={() => {}} static width="20rem" aria-labelledby="dheader-nocloseX-title">
      <DrawerHeader>
        <Text id="dheader-nocloseX-title" weight="semibold" size="lg">
          Syncing inventory…
        </Text>
      </DrawerHeader>
      <DrawerBody>
        <Text tone="muted">Hang tight — this closes automatically when the sync finishes.</Text>
      </DrawerBody>
    </Drawer>
  );
}
