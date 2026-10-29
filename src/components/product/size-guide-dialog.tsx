"use client";

import { Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SizeGuide } from "@/lib/size-guide";

export function SizeGuideDialog({ guide, productName }: { guide: SizeGuide; productName: string }) {
  const sizes = guide.sizes.length ? guide.sizes : Object.keys(guide.tables[0]?.rows[0]?.values ?? {});

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="gap-1.5 text-sm">
          <Ruler className="size-4" /> Size guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-medium">Size guide</DialogTitle>
          <DialogDescription>Garment measurements for {productName}, measured flat.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={guide.tables[0]?.unit ?? "inches"}>
          <TabsList>
            {guide.tables.map((t) => (
              <TabsTrigger key={t.unit} value={t.unit} className="min-h-10 px-4">
                {t.unit === "cm" ? "Centimeters" : "Inches"}
              </TabsTrigger>
            ))}
          </TabsList>
          {guide.tables.map((t) => (
            <TabsContent key={t.unit} value={t.unit} className="mt-4">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[420px] text-sm">
                  <caption className="sr-only">Measurements in {t.unit === "cm" ? "centimeters" : "inches"}</caption>
                  <thead className="bg-secondary">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-semibold">
                        Size
                      </th>
                      {sizes.map((s) => (
                        <th key={s} scope="col" className="px-3 py-2 text-left font-semibold">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {t.rows.map((row) => (
                      <tr key={row.label}>
                        <th scope="row" className="px-3 py-2 text-left font-medium">
                          {row.label}
                        </th>
                        {sizes.map((s) => (
                          <td key={s} className="px-3 py-2 tabular-nums">
                            {row.values[s] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        {guide.note && <p className="text-xs text-muted-foreground">{guide.note}</p>}
      </DialogContent>
    </Dialog>
  );
}
