import "server-only";
import { cacheLife } from "next/cache";
import { env } from "./env";

/** Verified garment measurements from the Printful catalog (inches and centimeters). */
export interface SizeGuide {
  sizes: string[];
  note: string | null;
  tables: { unit: "inches" | "cm"; rows: { label: string; values: Record<string, string> }[] }[];
}

interface PfSizeTable {
  type: string;
  unit: string;
  description?: string;
  measurements: { type_label: string; values: { size: string; value?: string; min_value?: string; max_value?: string }[] }[];
}

function plainText(html: string | undefined) {
  if (!html) return null;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  // Keep the supplier's tolerance note, drop marketing tips.
  return text.split(/Pro tip!/i)[0].trim() || null;
}

export async function getSizeGuide(catalogProductId: number): Promise<SizeGuide | null> {
  "use cache";
  cacheLife("days");

  try {
    const res = await fetch(`https://api.printful.com/products/${catalogProductId}/sizes?unit=inches,cm`, {
      headers: { Authorization: `Bearer ${env.printfulApiKey}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: { available_sizes?: string[]; size_tables?: PfSizeTable[] | null } };
    const tables = (json.result?.size_tables ?? []).filter((t) => t.type === "product_measure");
    if (tables.length === 0) return null;

    return {
      sizes: json.result?.available_sizes ?? [],
      note: plainText(tables[0].description),
      tables: tables
        .filter((t): t is PfSizeTable & { unit: "inches" | "cm" } => t.unit === "inches" || t.unit === "cm")
        .map((t) => ({
          unit: t.unit,
          rows: t.measurements.map((m) => ({
            label: m.type_label,
            values: Object.fromEntries(
              m.values.map((v) => [v.size, v.value ?? (v.min_value && v.max_value ? `${v.min_value}–${v.max_value}` : "—")]),
            ),
          })),
        })),
    };
  } catch {
    return null;
  }
}
