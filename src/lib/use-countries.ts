"use client";

import { useEffect, useState } from "react";

export interface Country {
  code: string;
  name: string;
  states: { code: string; name: string }[];
}

let request: Promise<Country[]> | null = null;

function loadCountries() {
  request ??= fetch("/api/shipping/countries")
    .then((res) => (res.ok ? (res.json() as Promise<Country[]>) : Promise.reject(new Error("failed"))))
    .catch((error) => {
      request = null;
      throw error;
    });
  return request;
}

/** Countries Printful ships to (loaded once per page), plus a default guessed from the browser locale. */
export function useCountries() {
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [defaultCountry, setDefaultCountry] = useState("US");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    loadCountries()
      .then((list) => {
        if (!active) return;
        setCountries(list);
        const region = navigator.language.split("-")[1]?.toUpperCase();
        if (region && list.some((c) => c.code === region)) setDefaultCountry(region);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  return { countries, defaultCountry, error };
}
