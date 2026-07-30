import { Button, Checkbox, Choice, Input, Popover, Select, Switch } from "@sorbet/component-library/atoms";
import { Cluster, Stack } from "@sorbet/component-library/layout";
import { Field, Menu, MenuHeading, MenuItem, MenuSeparator, useToast } from "@sorbet/component-library/molecules";
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@sorbet/component-library/organisms";
import { useState } from "react";

import type { DemoMeta } from "./types.ts";

/** Menu + Popover, plus the Modal and Drawer they open — the overlays live here
 *  rather than in App so the whole interaction is one self-contained demo. */
export function MenuDemo() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Cluster>
        <Menu alignEnd trigger={<Button variant="outline">Options ▾</Button>}>
          <MenuHeading>Project</MenuHeading>
          <MenuItem shortcut="⌘R" onSelect={() => toast("Rename selected")}>
            Rename
          </MenuItem>
          <MenuItem shortcut="⌘D" onSelect={() => toast("Duplicate selected")}>
            Duplicate
          </MenuItem>
          <MenuSeparator />
          <MenuItem danger onSelect={() => setModalOpen(true)}>
            Delete project
          </MenuItem>
        </Menu>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          Open drawer
        </Button>
        <Popover aria-label="Quick settings" trigger={<Button variant="outline">Popover ▾</Button>}>
          <Stack gap={3}>
            <strong>Quick settings</strong>
            <Field label="Project name">
              <Input defaultValue="Sorbet" size="sm" />
            </Field>
            <Choice>
              <Switch defaultChecked /> Public project
            </Choice>
            <Button size="sm" onClick={() => toast("Saved settings")}>
              Save
            </Button>
          </Stack>
        </Popover>
      </Cluster>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="sm">
        <ModalHeader onClose={() => setModalOpen(false)}>
          <h2>Delete project?</h2>
        </ModalHeader>
        <ModalBody>
          <Stack gap={3}>
            <p>
              This permanently removes <strong>sorbet-playground</strong>. It cannot be undone.
            </p>
            <Field label="Type the project name to confirm">
              <Input placeholder="sorbet-playground" />
            </Field>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setModalOpen(false);
              toast("Project deleted", { tone: "danger" });
            }}
          >
            Delete forever
          </Button>
        </ModalFooter>
      </Modal>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <DrawerHeader onClose={() => setDrawerOpen(false)}>
          <h3>Filters</h3>
        </DrawerHeader>
        <DrawerBody>
          <Stack>
            <Field label="Status">
              <Select defaultValue="Any">
                <option>Any</option>
                <option>Paid</option>
                <option>Pending</option>
              </Select>
            </Field>
            <Choice>
              <Checkbox defaultChecked /> Only my invoices
            </Choice>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
            Reset
          </Button>
          <Button onClick={() => setDrawerOpen(false)}>Apply</Button>
        </DrawerFooter>
      </Drawer>
    </>
  );
}

MenuDemo.demo = { title: "Menu", layer: "molecules", order: 60 } satisfies DemoMeta;
