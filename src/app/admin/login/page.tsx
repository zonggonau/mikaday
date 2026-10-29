import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Login admin",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-lg font-semibold">
          {site.name}
          <span className="text-brand">.</span> <span className="font-normal text-muted-foreground">admin</span>
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
