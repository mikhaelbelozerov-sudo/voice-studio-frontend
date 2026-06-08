import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { markReferralLaunchIfDetected } from "./utils/referralLink";
import { captureTelegramBootstrapSuffix } from "./utils/telegramBootstrap";
import "./i18n";
import "./index.css";
import "./styles/globals.css";

/** Before React Router navigates, persist Telegram launch params (referral + tgWebApp*). */
captureTelegramBootstrapSuffix();
markReferralLaunchIfDetected();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
