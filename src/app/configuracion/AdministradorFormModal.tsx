"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { ProfesorConDisciplinas, UsuarioAdmin } from "@/lib/supabase/types";
import { actualizarAdministrador, crearAdministrador } from "./actions";

const inputClass = "mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container";
const labelClass = "font-label-bold text-label-bold text-on-surface-variant";

export function AdministradorFormModal({
  mode,
  administrador,
  profesores,
  onClose,
}: {
  mode: "create" | "edit";
  administrador?: UsuarioAdmin;
  profesores: ProfesorConDisciplinas[];
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "edit" && administrador
          ? await actualizarAdministrador(administrador.id, formData)
          : await crearAdministrador(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={mode === "edit" ? "Editar Administrador" : "Nuevo Administrador"} onClose={onClose} maxWidth="max-w-md">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className={labelClass}>Nombre</label>
          <input name="nombre" required defaultValue={administrador?.nombre} className={inputClass} />
        </div>
        {mode === "create" && (
          <>
            <div>
              <label className={labelClass}>Email</label>
              <input name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contraseña inicial</label>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
            </div>
          </>
        )}
        <div>
          <label className={labelClass}>Profesor vinculado</label>
          <select name="profesor_id" defaultValue={administrador?.profesor_id ?? ""} className={inputClass}>
            <option value="">Sin vincular</option>
            {profesores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido} — DNI {p.dni}
              </option>
            ))}
          </select>
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
            {isPending ? "Guardando..." : "Guardar Administrador"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
