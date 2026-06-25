import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm("A new version is available. Reload to use it?")) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.info("ThesiSync is ready for offline use.");
    },
  });
}
