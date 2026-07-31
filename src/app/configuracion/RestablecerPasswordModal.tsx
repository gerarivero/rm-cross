"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { PasswordInput } from "@/components/PasswordInput";
import type { UsuarioAdmin } from "@/lib/supabase/types";
import { restablecerPasswordAdministrador } from "./actions";

const labelClass = "font-label-bold text-label-bold text-on-surface-variant";

export function RestablecerPasswordModal({ administrador, onClose }: { administrador: UsuarioAdmin; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await restablecerPasswordAdministrador(administrador.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={`Restablecer contraseña de ${administrador.nombre}`} onClose={onClose} maxWidth="max-w-md">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className={labelClass}>Nueva contraseña</label>
          <PasswordInput name="password" required minLength={8} autoComplete="new-password" />
        </div>
        <div>
          <label className={labelClass}>Confirmar contraseña</label>
          <PasswordInput name="confirmar" required minLength={8} autoComplete="new-password" />
        </div>
        <div className="flex justify-end gap-sm">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="px-lg py-2 rounded-lg border border-border text-on-surface-variant font-label-bold text-label-bold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            disabled={isPending}
            type="submit"
            className="bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-label-bold text-label-bold disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Restablecer Contraseña"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
