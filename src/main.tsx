import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { markReferralLaunchIfDetected } from "./utils/referralLink";
import { markTelegramDeepLinkLaunchIfDetected } from "./utils/telegramLaunchMode";
import {
  captureTelegramBootstrapSuffix,
  normalizeTelegramLaunchHashForRouter
} from "./utils/telegramBootstrap";
import "./i18n";
import "./index.css";
import "./styles/globals.css";

/** Before React Router: fix launch URL and persist tgWebApp* for in-app navigation. */
normalizeTelegramLaunchHashForRouter();
markTelegramDeepLinkLaunchIfDetected();
markReferralLaunchIfDetected();
captureTelegramBootstrapSuffix();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
