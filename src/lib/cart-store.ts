"use client";

import { useSyncExternalStore } from "react";

/**
 * Browser cart kept in localStorage. Prices here are for display only — the server
 * re-prices every line from the database at checkout.
 */
export interface CartLine {
  variantId: string;
  quantity: number;
  name: string;
  variantLabel: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  slug: string;
}

const STORAGE_KEY = "cart:v1";
const MAX_QUANTITY = 20;
const EMPTY: CartLine[] = [];

let lines: CartLine[] = EMPTY;
let loaded = false;
let open = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function isLine(value: unknown): value is CartLine {
  const v = value as CartLine;
  return !!v && typeof v.variantId === "string" && /^\d+$/.test(v.variantId) && Number.isInteger(v.quantity) && v.quantity > 0;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    lines = Array.isArray(parsed) ? parsed.filter(isLine) : EMPTY;
  } catch {
    lines = EMPTY;
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    emit();
  });
}

function commit(next: CartLine[]) {
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: the cart still works for this page view.
  }
  emit();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const cart = {
  add(line: Omit<CartLine, "quantity">, quantity: number) {
    load();
    const existing = lines.find((l) => l.variantId === line.variantId);
    commit(
      existing
        ? lines.map((l) =>
            l.variantId === line.variantId ? { ...l, ...line, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) } : l,
          )
        : [...lines, { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }],
    );
  },
  setQuantity(variantId: string, quantity: number) {
    load();
    commit(
      quantity <= 0
        ? lines.filter((l) => l.variantId !== variantId)
        : lines.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l)),
    );
  },
  remove(variantId: string) {
    cart.setQuantity(variantId, 0);
  },
  /** Applies server prices and drops lines the server says can no longer be sold. */
  reconcile(prices: Map<string, number>, unavailable: string[]) {
    load();
    const gone = new Set(unavailable);
    const next = lines
      .filter((l) => !gone.has(l.variantId))
      .map((l) => (prices.has(l.variantId) && prices.get(l.variantId) !== l.price ? { ...l, price: prices.get(l.variantId)! } : l));
    if (next.length !== lines.length || next.some((l, i) => l !== lines[i])) commit(next);
  },
  clear() {
    commit(EMPTY);
  },
  open() {
    open = true;
    emit();
  },
  close() {
    open = false;
    emit();
  },
};

export function useCart() {
  const items = useSyncExternalStore(
    subscribe,
    () => {
      load();
      return lines;
    },
    () => EMPTY,
  );
  const isOpen = useSyncExternalStore(subscribe, () => open, () => false);
  const count = items.reduce((n, l) => n + l.quantity, 0);
  const subtotal = items.reduce((sum, l) => sum + Math.round(l.price * 100) * l.quantity, 0) / 100;
  return { items, count, subtotal, isOpen };
}
