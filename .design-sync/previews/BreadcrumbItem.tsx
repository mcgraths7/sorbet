import { Breadcrumb, BreadcrumbItem } from "@sorbet/component-library";

// BreadcrumbItem only makes sense inside a Breadcrumb — this composes the
// full parent, same as the Breadcrumb.tsx preview, which is the honest render.

export function Default() {
  return (
    <Breadcrumb>
      <BreadcrumbItem href="/">Home</BreadcrumbItem>
      <BreadcrumbItem href="/orders">Orders</BreadcrumbItem>
      <BreadcrumbItem href="/orders/48213">#48213</BreadcrumbItem>
      <BreadcrumbItem current>Tracking</BreadcrumbItem>
    </Breadcrumb>
  );
}

export function TwoLevels() {
  return (
    <Breadcrumb>
      <BreadcrumbItem href="/settings">Settings</BreadcrumbItem>
      <BreadcrumbItem current>Notifications</BreadcrumbItem>
    </Breadcrumb>
  );
}
