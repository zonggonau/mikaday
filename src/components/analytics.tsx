"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { openCookieSettings, setConsent, useConsent, useCookieSettingsOpen } from "@/lib/consent";

const noop = () => () => {};

/**
 * Google Analytics 4, loaded only after the visitor accepts analytics cookies.
 * Ecommerce events are sent with trackEvent() from the cart and checkout.
 */
export function Analytics({ measurementId }: { measurementId: string }) {
  const consent = useConsent();
  const settingsOpen = useCookieSettingsOpen();
  // The banner waits for the browser to read the stored choice, so it never flashes for returning visitors.
  const ready = useSyncExternalStore(noop, () => true, () => false);

  useEffect(() => {
    if (!measurementId) return;
    // Withdrawing consent stops tracking for the rest of the visit (gtag stays loaded until reload)…
    (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] = consent !== "granted";
    // …and removes the cookies GA already set.
    if (consent === "denied") {
      const domain = location.hostname.replace(/^www\./, "");
      for (const name of document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n.startsWith("_ga"))) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
        document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
      }
    }
  }, [consent, measurementId]);

  if (!measurementId) return null;

  return (
    <>
      {consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');`}
          </Script>
        </>
      )}
      {ready && (consent === "unset" || settingsOpen) && <CookieBanner current={consent} />}
    </>
  );
}

function CookieBanner({ current }: { current: "granted" | "denied" | "unset" }) {
  return (
    <section
      aria-labelledby="cookie-title"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-card p-5 shadow-lg sm:inset-x-6 sm:bottom-6"
    >
      <h2 id="cookie-title" className="font-semibold">
        Cookies
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We&apos;d like to use Google Analytics cookies to understand how visitors use MIKADAY. Your cart works without them.{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy policy
        </Link>
        {current !== "unset" && <> · Current choice: {current === "granted" ? "accepted" : "declined"}.</>}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => setConsent("granted")} className="sm:flex-1">
          Accept analytics
        </Button>
        <Button variant="outline" onClick={() => setConsent("denied")} className="sm:flex-1">
          Decline
        </Button>
      </div>
    </section>
  );
}

/** Footer link that reopens the banner. */
export function CookieSettingsButton() {
  return (
    <button type="button" onClick={openCookieSettings} className="inline-flex min-h-9 items-center underline-offset-2 hover:text-primary hover:underline">
      Cookie settings
    </button>
  );
}
