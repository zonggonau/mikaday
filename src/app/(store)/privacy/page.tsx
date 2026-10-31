import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyView } from "@/components/policy-view";
import { getPolicy } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How MIKADAY collects, uses, and protects your personal information when you shop with us.",
  path: "/privacy",
});

export default async function PrivacyPage() {
  const policy = await getPolicy("privacy");
  if (!policy) notFound();
  return (
    <div className="container-page py-12 lg:py-16">
      <PolicyView policy={policy} />
    </div>
  );
}
