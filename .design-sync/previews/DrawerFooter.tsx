import { Button, Drawer, DrawerBody, DrawerFooter, DrawerHeader, Text } from "@sorbet/component-library";

// DrawerFooter only makes sense inside an open Drawer, so each card composes
// the full panel. This card's focus is the footer action row itself.

export function Default() {
  return (
    <Drawer open onClose={() => {}} aria-labelledby="dfooter-default-title">
      <DrawerHeader onClose={() => {}}>
        <Text id="dfooter-default-title" weight="semibold" size="lg">
          Edit delivery window
        </Text>
      </DrawerHeader>
      <DrawerBody>
        <Text tone="muted">Choose a two-hour window for your next delivery.</Text>
      </DrawerBody>
      <DrawerFooter>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save window</Button>
      </DrawerFooter>
    </Drawer>
  );
}

export function ThreeActions() {
  return (
    <Drawer open onClose={() => {}} aria-labelledby="dfooter-three-title">
      <DrawerHeader onClose={() => {}}>
        <Text id="dfooter-three-title" weight="semibold" size="lg">
          Cancel subscription
        </Text>
      </DrawerHeader>
      <DrawerBody>
        <Text tone="muted">You'll keep access until the end of your current billing period.</Text>
      </DrawerBody>
      <DrawerFooter>
        <Button variant="ghost">Never mind</Button>
        <Button variant="outline">Pause instead</Button>
        <Button variant="danger">Cancel plan</Button>
      </DrawerFooter>
    </Drawer>
  );
}
