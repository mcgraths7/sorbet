import { Button, EmptyState, SearchIcon, UploadIcon } from "@sorbet/component-library";

export function NoResults() {
  return (
    <EmptyState
      icon={<SearchIcon />}
      title="No recipes match your search"
      action={
        <Button variant="outline" size="sm">
          Clear filters
        </Button>
      }
    >
      Try a different ingredient, cuisine, or cook time — or browse this week's full menu instead.
    </EmptyState>
  );
}

export function NoUploads() {
  return (
    <EmptyState icon={<UploadIcon />} title="No files uploaded yet" action={<Button size="sm">Upload a file</Button>}>
      Drag and drop CSV files here, or click upload to import your supplier list.
    </EmptyState>
  );
}
