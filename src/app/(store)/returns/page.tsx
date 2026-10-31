import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyView } from "@/components/policy-view";
import { getPolicy } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Returns & Exchanges",
  description: "How returns, exchanges, and damaged or misprinted items are handled for MIKADAY orders.",
  path: "/returns",
});

export default async function ReturnsPage() {
  const policy = await getPolicy("returns");
  if (!policy) notFound();
  return (
    <div className="container-page py-12 lg:py-16">
      <PolicyView policy={policy} />
    </div>
  );
}
