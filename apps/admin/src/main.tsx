import { ThemeProvider } from "@sorbet/component-library/core";
import { ToastProvider } from "@sorbet/component-library/molecules";
import { ConfirmProvider } from "@sorbet/component-library/organisms";
import "@sorbet/design-system/css";
// Ocean, where the marketing site uses forest — same components, different
// personality, which is the point of the preset layer.
import "@sorbet/design-system/themes/ocean.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";

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
