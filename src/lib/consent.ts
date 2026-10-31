"use client";

import { useSyncExternalStore } from "react";

// Analytics consent, kept in localStorage. Google Analytics only loads after "granted".

export type Consent = "granted" | "denied" | "unset";

const KEY = "mikaday-consent";
const listeners = new Set<() => void>();
let settingsOpen = false;

function read(): Consent {
  try {
    const value = localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    return "unset";
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => event.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setConsent(value: "granted" | "denied") {
  try {
    localStorage.setItem(KEY, value);
  } catch {}
  settingsOpen = false;
  emit();
}

/** Reopens the banner (footer "Cookie settings") so a choice can be changed or withdrawn. */
export function openCookieSettings() {
  settingsOpen = true;
  emit();
}

export function useConsent(): Consent {
  // The server never knows the choice: render as "unset" until the browser has read it.
  return useSyncExternalStore(subscribe, read, () => "unset");
}

export function useCookieSettingsOpen() {
  return useSyncExternalStore(subscribe, () => settingsOpen, () => false);
}
