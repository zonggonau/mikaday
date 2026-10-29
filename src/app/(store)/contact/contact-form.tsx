"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { preservingSubmit } from "@/lib/use-preserving-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage, type ContactState } from "./actions";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(sendContactMessage, {});

  if (state.ok) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6" role="status">
        <CheckCircle2 className="size-7 text-success" aria-hidden />
        <h2 className="text-h3">Thanks — your message was sent.</h2>
        <p className="text-muted-foreground">We&apos;ll reply to the email address you provided.</p>
      </div>
    );
  }

  return (
    <form onSubmit={preservingSubmit(formAction)} className="grid grid-cols-1 gap-5 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="contact-name">Name</Label>
        <Input id="contact-name" name="name" required minLength={2} maxLength={100} autoComplete="name" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="contact-order">
          Order number <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="contact-order" name="orderNumber" maxLength={40} placeholder="e.g. ORD-1001" />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea id="contact-message" name="message" required minLength={10} maxLength={5000} rows={6} className="min-h-36 bg-card" />
      </div>
      <div className="hidden" aria-hidden>
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {state.error}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
