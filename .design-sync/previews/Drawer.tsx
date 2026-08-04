import {
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Field,
  Input,
  Text,
} from "@sorbet/component-library";

// Drawer wraps a native <dialog> opened via showModal()/show() — a static
// `open` prop drives the real mount effect, so this is the actual panel/scrim
// chrome, not a mocked-up look-alike. A real open drawer renders in the top
// layer, edge-attached to the viewport, so it's expected to escape the card
// grid — see learnings for the cardMode:"single" flag.

export function Default() {
  return (
    <Drawer open onClose={() => {}} aria-labelledby="drawer-default-title">
      <DrawerHeader onClose={() => {}}>
        <Text id="drawer-default-title" weight="semibold" size="lg">
          Filter orders
        </Text>
      </DrawerHeader>
      <DrawerBody>
        <Field label="Status" hint="Only show orders matching this status.">
          <Input defaultValue="In transit" />
        </Field>
        <Field label="Delivery window">
          <Input defaultValue="This week" />
        </Field>
      </DrawerBody>
      <DrawerFooter>
        <Button variant="ghost">Reset</Button>
        <Button variant="primary">Apply filters</Button>
      </DrawerFooter>
    </Drawer>
  );
}

export function FromStart() {
  return (
    <Drawer open onClose={() => {}} side="start" width="20rem" aria-labelledby="drawer-start-title">
      <DrawerHeader onClose={() => {}}>
        <Text id="drawer-start-title" weight="semibold" size="lg">
          Menu
        </Text>
      </DrawerHeader>
      <DrawerBody>
        <Text tone="muted">Dashboard</Text>
        <Text tone="muted">Orders</Text>
        <Text tone="muted">Recipes</Text>
        <Text tone="muted">Customers</Text>
      </DrawerBody>
    </Drawer>
  );
}

export function Modeless() {
  return (
    <Drawer open onClose={() => {}} modeless width="22rem" aria-labelledby="drawer-modeless-title">
      <DrawerHeader onClose={() => {}}>
        <Text id="drawer-modeless-title" weight="semibold" size="lg">
          Box inspector
        </Text>
      </DrawerHeader>
      <DrawerBody>
        <Text tone="muted">Box #4821 — packed 6:12am, 8 items, 2 substitutions applied.</Text>
      </DrawerBody>
    </Drawer>
  );
}
