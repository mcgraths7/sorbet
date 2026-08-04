import { Breadcrumb, BreadcrumbItem } from "@sorbet/component-library";

export function Default() {
  return (
    <Breadcrumb>
      <BreadcrumbItem href="/">Home</BreadcrumbItem>
      <BreadcrumbItem href="/recipes">Recipes</BreadcrumbItem>
      <BreadcrumbItem href="/recipes/weeknight">Weeknight dinners</BreadcrumbItem>
      <BreadcrumbItem current>Miso-glazed salmon</BreadcrumbItem>
    </Breadcrumb>
  );
}

export function ShortPath() {
  return (
    <Breadcrumb>
      <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
      <BreadcrumbItem current>Billing</BreadcrumbItem>
    </Breadcrumb>
  );
}
