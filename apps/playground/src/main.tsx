import { ThemeProvider, ToastProvider } from "@sorbet/react";
import "@sorbet/styles/css";
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
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
