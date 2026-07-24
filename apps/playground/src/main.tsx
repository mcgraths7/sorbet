import { ThemeProvider } from "@sorbet/component-library/core";
import { ToastProvider } from "@sorbet/component-library/molecules";
import { ConfirmProvider } from "@sorbet/component-library/organisms";
import "@sorbet/design-system/css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";

// Preset stylesheet swaps at runtime; App drives the href.
const link = document.createElement("link");
link.rel = "stylesheet";
link.id = "preset-css";
document.head.append(link);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
