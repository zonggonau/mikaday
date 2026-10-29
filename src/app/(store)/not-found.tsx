import { Compass } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function StoreNotFound() {
  return (
    <div className="container-page py-20">
      <EmptyState
        icon={Compass}
        title="We couldn't find that page"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/shop">Browse the shop</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/journal">Read the journal</Link>
            </Button>
          </div>
        }
      >
        It may have moved, or the item is no longer available.
      </EmptyState>
    </div>
  );
}
