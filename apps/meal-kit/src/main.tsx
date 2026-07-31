import { ThemeProvider } from "@sorbet/component-library/core";
import { ToastProvider } from "@sorbet/component-library/molecules";
import "@sorbet/design-system/css";
// A real site picks one preset and ships it. Forest suits a fresh-food brand.
import "@sorbet/design-system/themes/forest.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
