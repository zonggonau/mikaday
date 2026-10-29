import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyView } from "@/components/policy-view";
import { getPolicy } from "@/lib/content";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const policy = await getPolicy("privacy");
  if (!policy) notFound();
  return (
    <div className="container-page py-12 lg:py-16">
      <PolicyView policy={policy} />
    </div>
  );
}
