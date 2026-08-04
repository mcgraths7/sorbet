import { Pagination } from "@sorbet/component-library";

export function Default() {
  return <Pagination page={4} pageCount={12} onPageChange={() => {}} aria-label="Orders" />;
}

export function FewPages() {
  return <Pagination page={2} pageCount={4} onPageChange={() => {}} aria-label="Recipe collections" />;
}

export function NearEnd() {
  return <Pagination page={11} pageCount={12} onPageChange={() => {}} aria-label="Customer reviews" />;
}
