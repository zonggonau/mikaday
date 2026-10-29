"use client";

import { useEffect, useRef, useState } from "react";

// Minimal typing for the PayPal JS SDK (v5) Buttons component.
interface PayPalButtonsInstance {
  render(container: HTMLElement): Promise<void>;
  close(): Promise<void>;
}

interface PayPalNamespace {
  Buttons(options: {
    style?: Record<string, string | number>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }, actions: { restart(): Promise<void> }) => Promise<void>;
    onError: (error: unknown) => void;
  }): PayPalButtonsInstance;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

let sdk: Promise<PayPalNamespace> | null = null;

function loadSdk(clientId: string, currency: string) {
  sdk ??= new Promise<PayPalNamespace>((resolve, reject) => {
    const params = new URLSearchParams({
      "client-id": clientId,
      currency,
      intent: "capture",
      components: "buttons",
      // Shows the "Debit or Credit Card" button so buyers without a PayPal account can pay.
      "enable-funding": "card",
      // Pay Later (installments) is not offered by this store.
      "disable-funding": "paylater",
    });
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params}`;
    script.async = true;
    script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error("PayPal unavailable")));
    script.onerror = () => {
      sdk = null;
      script.remove();
      reject(new Error("Could not load PayPal"));
    };
    document.head.appendChild(script);
  });
  return sdk;
}

export function PayPalButtons({
  clientId,
  currency,
  createOrder,
  onApprove,
  onError,
}: {
  clientId: string;
  currency: string;
  createOrder: () => Promise<string>;
  /** Return "restart" to let the buyer pick another funding source (e.g. card declined). */
  onApprove: (paypalOrderId: string) => Promise<"done" | "restart">;
  onError: (error: unknown) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const handlers = useRef({ createOrder, onApprove, onError });
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    handlers.current = { createOrder, onApprove, onError };
  });

  useEffect(() => {
    let cancelled = false;
    let buttons: PayPalButtonsInstance | undefined;

    loadSdk(clientId, currency)
      .then((paypal) => {
        if (cancelled || !container.current) return;
        buttons = paypal.Buttons({
          style: { layout: "vertical", shape: "pill", label: "pay", height: 48 },
          createOrder: () => handlers.current.createOrder(),
          onApprove: async (data, actions) => {
            if ((await handlers.current.onApprove(data.orderID)) === "restart") await actions.restart();
          },
          onError: (error) => handlers.current.onError(error),
        });
        return buttons.render(container.current).then(() => {
          if (!cancelled) setStatus("ready");
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
      void buttons?.close().catch(() => {});
    };
  }, [clientId, currency]);

  return (
    <div>
      {status === "loading" && <div className="h-28 animate-pulse rounded-2xl bg-line/60" aria-label="Loading payment options" />}
      {status === "failed" && (
        <p className="text-sm text-danger">PayPal could not be loaded. Please disable ad blockers for this page and refresh.</p>
      )}
      <div ref={container} />
    </div>
  );
}
