import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { markReferralLaunchIfDetected } from "./utils/referralLink";
import { markTelegramDeepLinkLaunchIfDetected } from "./utils/telegramLaunchMode";
import { captureTelegramBootstrapSuffix } from "./utils/telegramBootstrap";
import "./i18n";
import "./index.css";
import "./styles/globals.css";

/**
 * Before React Router: patch launch URL with tgWebApp* (iOS named direct links from chat)
 * and persist bootstrap for the session.
 */
markTelegramDeepLinkLaunchIfDetected();
markReferralLaunchIfDetected();
captureTelegramBootstrapSuffix();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <HashRouter>
    <App />
  </HashRouter>
);
