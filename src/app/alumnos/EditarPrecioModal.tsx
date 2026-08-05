"use client";

import { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { AlumnoDetalle } from "@/lib/supabase/types";
import { actualizarPrecioInscripcion } from "./actions";

export function EditarPrecioModal({
  alumno,
  promociones,
  onClose,
}: {
  alumno: AlumnoDetalle;
  promociones: { id: string; nombre: string; plan_ids: string[] }[];
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [aplicarPromocion, setAplicarPromocion] = useState(alumno.precio_acordado !== null);
  const [precio, setPrecio] = useState<string>(alumno.precio_acordado !== null ? String(alumno.precio_acordado) : "");

  const promocionesDelPlan = useMemo(
    () => (alumno.plan ? promociones.filter((p) => p.plan_ids.includes(alumno.plan!.id)) : []),
    [promociones, alumno.plan]
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await actualizarPrecioInscripcion(alumno.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="Editar Precio" onClose={onClose} maxWidth="max-w-md">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <p className="text-body-sm text-on-surface-variant">
          Plan: <span className="font-label-bold text-on-surface">{alumno.plan?.nombre}</span>
        </p>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="aplicar_promocion"
            name="aplicar_promocion"
            checked={aplicarPromocion}
            onChange={(e) => setAplicarPromocion(e.target.checked)}
          />
          <label htmlFor="aplicar_promocion" className="font-label-bold text-label-bold text-on-surface-variant">
            Aplicar precio promocional / acordado
          </label>
        </div>

        {aplicarPromocion ? (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-md grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className="font-label-bold text-label-bold text-on-surface-variant">Promoción</label>
              <select
                name="promocion_id"
                defaultValue={alumno.promocion_id ?? ""}
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
              >
                <option value="">Sin promoción (precio negociado)</option>
                {promocionesDelPlan.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-label-bold text-label-bold text-on-surface-variant">Precio acordado</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-sm pointer-events-none">$</span>
                <input
                  name="precio"
                  type="number"
                  required
                  step="0.01"
                  min={1}
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full border border-border rounded-lg pl-7 pr-3 py-2 outline-none focus:border-primary-container"
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-caption font-caption text-text-muted">
            Sin promoción, el alumno pasa a cobrar el precio de lista vigente del plan.
          </p>
        )}

        <p className="text-caption font-caption text-text-muted">
          Este cambio actualiza el monto de la cuota todavía no pagada de este alumno.
        </p>

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
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
