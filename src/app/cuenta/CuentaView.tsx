"use client";

import { useState, useTransition } from "react";
import { useMobileNav } from "@/components/MobileNavProvider";
import type { UsuarioActual } from "@/lib/supabase/session";
import type { ProfesorConDisciplinas } from "@/lib/supabase/types";
import { cambiarContrasena, vincularProfesor } from "./actions";

const inputClass = "mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container";
const labelClass = "font-label-bold text-label-bold text-on-surface-variant";

export function CuentaView({ usuario, profesores }: { usuario: UsuarioActual; profesores: ProfesorConDisciplinas[] }) {
  const { toggleMobileNav } = useMobileNav();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [errorVinculo, setErrorVinculo] = useState<string | null>(null);
  const [exitoVinculo, setExitoVinculo] = useState(false);
  const [vinculoPending, startVinculoTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setExito(false);
    startTransition(async () => {
      const result = await cambiarContrasena(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setExito(true);
      (document.getElementById("form-cambiar-contrasena") as HTMLFormElement)?.reset();
    });
  }

  function handleVincular(formData: FormData) {
    setErrorVinculo(null);
    setExitoVinculo(false);
    startVinculoTransition(async () => {
      const result = await vincularProfesor(formData);
      if (!result.ok) {
        setErrorVinculo(result.error);
        return;
      }
      setExitoVinculo(true);
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex justify-between items-center px-lg py-md w-full">
        <h2 className="font-headline-md text-headline-md text-primary">Mi Cuenta</h2>
        <button
          onClick={toggleMobileNav}
          className="md:hidden p-2 text-on-surface-variant hover:text-primary-container transition-all duration-200"
          title="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      <div className="p-lg space-y-gutter flex-1">
        <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_circle</span>
            Información de la cuenta
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Nombre</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{usuario.nombre}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Email</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{usuario.email}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Rol</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{usuario.es_admin ? "Admin" : "Profesor"}</p>
            </div>
          </div>

          <div className="border-t border-border mt-lg pt-lg">
            <p className={labelClass}>Profesor vinculado</p>
            <p className="text-body-sm font-body-sm text-text-muted mb-2">
              Qué profesor del roster (módulo Profesores) corresponde a esta cuenta.
            </p>
            {errorVinculo && (
              <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{errorVinculo}</div>
            )}
            {exitoVinculo && (
              <div className="bg-success/10 border border-success/30 text-success rounded-lg p-sm text-body-sm mb-md">
                Vínculo actualizado correctamente.
              </div>
            )}
            <form action={handleVincular} className="flex flex-col sm:flex-row gap-md max-w-lg">
              <select name="profesor_id" defaultValue={usuario.profesor_id ?? ""} className={`${inputClass} mt-0 flex-1`}>
                <option value="">Sin vincular</option>
                {profesores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} — DNI {p.dni}
                  </option>
                ))}
              </select>
              <button
                disabled={vinculoPending}
                type="submit"
                className="bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-label-bold text-label-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
              >
                {vinculoPending ? "Guardando..." : "Guardar Vínculo"}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lock</span>
            Cambiar contraseña
          </h3>
          {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
          {exito && (
            <div className="bg-success/10 border border-success/30 text-success rounded-lg p-sm text-body-sm mb-md">
              Contraseña actualizada correctamente.
            </div>
          )}
          <form id="form-cambiar-contrasena" action={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-md max-w-lg">
            <div>
              <label className={labelClass}>Nueva contraseña</label>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Confirmar contraseña</label>
              <input name="confirmar" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <button
                disabled={isPending}
                type="submit"
                className="bg-primary-container text-on-primary-container px-lg py-2.5 rounded-lg font-label-bold text-label-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Guardar Contraseña"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
