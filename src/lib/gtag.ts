"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sends a GA4 event when Google Analytics is loaded; a no-op otherwise. */
export function trackEvent(name: string, params: Record<string, unknown>) {
  window.gtag?.("event", name, params);
}
