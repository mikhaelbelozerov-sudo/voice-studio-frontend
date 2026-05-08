import { useCallback } from "react";
import { createInvoice, CreateInvoiceRequest } from "../services/api";

type OpenInvoiceStatus = "paid" | "cancelled" | "failed" | "pending";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openInvoice?: (url: string, callback?: (status: OpenInvoiceStatus) => void) => void;
      };
    };
  }
}

export const useTelegramStarsPurchase = (telegramId: number | null) => {
  const purchase = useCallback(
    async (
      invoicePayload: CreateInvoiceRequest,
      onResult?: (status: Exclude<OpenInvoiceStatus, "pending">) => void
    ) => {
      if (!telegramId) {
        onResult?.("failed");
        return;
      }

      const openInvoice = window.Telegram?.WebApp?.openInvoice;
      if (!openInvoice) {
        return;
      }

      try {
        const invoice = await createInvoice(invoicePayload);

        openInvoice(invoice.invoiceLink, async (status) => {
          if (status === "paid") {
            onResult?.("paid");
            return;
          }
          if (status === "cancelled") {
            onResult?.("cancelled");
            return;
          }
          if (status === "failed") {
            onResult?.("failed");
            return;
          }
          onResult?.("failed");
        });
      } catch (_e) {
        onResult?.("failed");
      }
    },
    [telegramId]
  );

  return { purchase };
};
