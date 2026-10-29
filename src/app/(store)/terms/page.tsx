import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyView } from "@/components/policy-view";
import { getPolicy } from "@/lib/content";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const policy = await getPolicy("terms");
  if (!policy) notFound();
  return (
    <div className="container-page py-12 lg:py-16">
      <PolicyView policy={policy} />
    </div>
  );
}
