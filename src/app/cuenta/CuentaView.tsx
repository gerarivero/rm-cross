"use client";

import { useState, useTransition } from "react";
import { useMobileNav } from "@/components/MobileNavProvider";
import { PasswordInput } from "@/components/PasswordInput";
import type { UsuarioActual } from "@/lib/supabase/session";
import { cambiarContrasena } from "./actions";

const labelClass = "font-label-bold text-label-bold text-on-surface-variant";

export function CuentaView({ usuario }: { usuario: UsuarioActual }) {
  const { toggleMobileNav } = useMobileNav();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [isPending, startTransition] = useTransition();

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
              <PasswordInput name="password" required minLength={8} autoComplete="new-password" />
            </div>
            <div>
              <label className={labelClass}>Confirmar contraseña</label>
              <PasswordInput name="confirmar" required minLength={8} autoComplete="new-password" />
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
