import { Cluster } from "@sorbet/component-library/layout";
import {
  Accordion,
  AccordionItem,
  Breadcrumb,
  BreadcrumbItem,
  Pagination,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@sorbet/component-library/molecules";
import { useState } from "react";

import type { Demo } from "./types.ts";

export function WayfindingDemo() {
  const [page, setPage] = useState(2);
  return (
    <>
      <Tabs defaultValue="overview">
        <TabList aria-label="Example tabs">
          <Tab value="overview">Overview</Tab>
          <Tab value="activity">Activity</Tab>
          <Tab value="settings">Settings</Tab>
        </TabList>
        <TabPanel value="overview">
          <p className="u-text-muted">Controlled or uncontrolled; arrow keys work.</p>
        </TabPanel>
        <TabPanel value="activity">
          <p className="u-text-muted">Recent activity renders here.</p>
        </TabPanel>
        <TabPanel value="settings">
          <p className="u-text-muted">Settings form renders here.</p>
        </TabPanel>
      </Tabs>
      <Accordion name="faq">
        <AccordionItem name="faq" summary="Native details/summary underneath?" defaultOpen>
          Yes — exclusive-open via the shared <code>name</code>, animated by <code>interpolate-size</code>.
        </AccordionItem>
        <AccordionItem name="faq" summary="Do themes stay accessible?">
          Contrast is checked at build time; failing palettes fail the build.
        </AccordionItem>
      </Accordion>
      <Cluster justify="between">
        <Breadcrumb>
          <BreadcrumbItem href="#top">Home</BreadcrumbItem>
          <BreadcrumbItem href="#top">Projects</BreadcrumbItem>
          <BreadcrumbItem current>Sorbet</BreadcrumbItem>
        </Breadcrumb>
        <Pagination page={page} pageCount={12} onPageChange={setPage} />
      </Cluster>
    </>
  );
}

export const demo: Demo = {
  title: "Tabs, accordion & wayfinding",
  layer: "molecules",
  order: 40,
  Component: WayfindingDemo,
};
