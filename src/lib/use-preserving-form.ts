"use client";

import { startTransition, type FormEvent } from "react";

/**
 * Submit handler for a useActionState form that keeps what the user typed.
 * `<form action={fn}>` resets uncontrolled fields after every submission — including
 * validation errors — so forms submit through onSubmit instead.
 */
export function preservingSubmit(dispatch: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };
}
