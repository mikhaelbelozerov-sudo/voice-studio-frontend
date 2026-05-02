import React from "react";
import ReactDOM from "react-dom/client";
import WebApp from "@twa-dev/sdk";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import App from "./App";
import "./i18n";
import "./index.css";
import { initTelegramViewportOnce } from "./initTelegramViewportOnce";

initTelegramViewportOnce();

/** В нативном клиенте Telegram history API иногда ведёт себя непредсказуемо в WebView; MemoryRouter не трогает адресную строку. */
const openedInsideTelegram = WebApp.platform !== "unknown";

const root = (
  openedInsideTelegram ? (
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  ) : (
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(root);
