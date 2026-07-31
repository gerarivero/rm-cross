"use client";

import { useState, useTransition } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { iniciarSesion } from "./actions";

const inputClass = "mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container";
const labelClass = "font-label-bold text-label-bold text-on-surface-variant";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await iniciarSesion(formData);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-md">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm">{error}</div>}
      <div>
        <label className={labelClass}>Email</label>
        <input name="email" type="email" required autoComplete="username" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Contraseña</label>
        <PasswordInput name="password" required autoComplete="current-password" />
      </div>
      <button
        disabled={isPending}
        type="submit"
        className="w-full bg-primary-container text-on-primary-container px-lg py-2.5 rounded-lg font-label-bold text-label-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
      >
        {isPending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
