import { Button, Drawer, DrawerBody, DrawerFooter, DrawerHeader, Text } from "@sorbet/component-library";

// DrawerBody only makes sense inside an open Drawer, so each card composes
// the full panel. This card's focus is the scrollable content area itself.

export function Default() {
  return (
    <Drawer open onClose={() => {}} aria-labelledby="dbody-default-title">
      <DrawerHeader onClose={() => {}}>
        <Text id="dbody-default-title" weight="semibold" size="lg">
          Recipe: Miso Glazed Salmon
        </Text>
      </DrawerHeader>
      <DrawerBody>
        <Text weight="semibold">Ingredients</Text>
        <Text tone="muted">Salmon fillet, white miso, mirin, scallion, sesame seeds.</Text>
        <Text weight="semibold">Steps</Text>
        <Text tone="muted">
          Whisk miso, mirin, and a splash of soy. Marinate salmon 10 minutes, then broil 8–10
          minutes until glazed and flaky.
        </Text>
      </DrawerBody>
      <DrawerFooter>
        <Button variant="ghost">Save for later</Button>
        <Button variant="primary">Add to this week's box</Button>
      </DrawerFooter>
    </Drawer>
  );
}

export function ScrollableList() {
  return (
    <Drawer open onClose={() => {}} aria-labelledby="dbody-scroll-title">
      <DrawerHeader onClose={() => {}}>
        <Text id="dbody-scroll-title" weight="semibold" size="lg">
          Order activity
        </Text>
      </DrawerHeader>
      <DrawerBody>
        <Text tone="muted">6:02am — Order #4821 packed</Text>
        <Text tone="muted">6:14am — Order #4821 labeled</Text>
        <Text tone="muted">7:40am — Order #4821 picked up by carrier</Text>
        <Text tone="muted">9:05am — Order #4821 arrived at regional hub</Text>
      </DrawerBody>
    </Drawer>
  );
}
