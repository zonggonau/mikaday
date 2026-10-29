"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SearchDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Search products">
          <Search className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-24 translate-y-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-medium">Search the shop</DialogTitle>
          <DialogDescription>Find mugs, tees, and more by name or color.</DialogDescription>
        </DialogHeader>
        <Form action="/shop" onSubmit={() => setOpen(false)} className="flex gap-2">
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <Input id="site-search" name="q" type="search" placeholder="Try “mug” or “black”" autoComplete="off" autoFocus />
          <Button type="submit">Search</Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
