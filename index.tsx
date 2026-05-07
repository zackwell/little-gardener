import { createRoot } from "react-dom/client";
import App from "./main";
import "./index.css";
import { SettingsProvider } from "./settings-context";

createRoot(document.getElementById("root")!).render(
  <SettingsProvider>
    <App />
  </SettingsProvider>,
);
