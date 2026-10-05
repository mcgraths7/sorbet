import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// `SORBET_LIBRARY_CSS` (a path to a compiled stylesheet) swaps the library's
// stylesheet, `@sorbet/design-system/css`, for that file, and nothing else.
// Only the screenshot comparer sets it (`<root>/tools/shots.ts`, `baseline
// --at <ref>`): it shoots this playground with another commit's stylesheet,
// so the stylesheet is the only thing that differs between the two runs. The
// theme files (`/themes/*.css?url`) are not matched and stay this tree's.
const libraryCss = process.env.SORBET_LIBRARY_CSS;

export default defineConfig({
  plugins: [react()],
  ...(libraryCss ? { resolve: { alias: [{ find: /^@sorbet\/design-system\/css$/, replacement: libraryCss }] } } : {}),
});
