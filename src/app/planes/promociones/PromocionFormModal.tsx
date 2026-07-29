"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { Plan, PromocionConPlanes } from "@/lib/supabase/types";
import { actualizarPromocion, crearPromocion } from "./actions";

export function PromocionFormModal({
  mode,
  planes,
  promocion,
  onClose,
}: {
  mode: "create" | "edit";
  planes: Plan[];
  promocion?: PromocionConPlanes;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const planesSeleccionadosIniciales = new Set((promocion?.planes ?? []).map((p) => p.id));

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "edit" && promocion ? await actualizarPromocion(promocion.id, formData) : await crearPromocion(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={mode === "edit" ? "Editar Promoción" : "Nueva Promoción"} onClose={onClose}>
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Nombre</label>
          <input
            name="nombre"
            required
            defaultValue={promocion?.nombre}
            placeholder="Ej: Promo Verano 2026"
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
          />
        </div>
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Descripción</label>
          <textarea
            name="descripcion"
            defaultValue={promocion?.descripcion ?? undefined}
            placeholder="Opcional"
            rows={2}
            className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div>
            <label className="font-label-bold text-label-bold text-on-surface-variant">Vigente desde</label>
            <input
              name="fecha_inicio"
              type="date"
              defaultValue={promocion?.fecha_inicio ?? undefined}
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
            />
          </div>
          <div>
            <label className="font-label-bold text-label-bold text-on-surface-variant">Vigente hasta</label>
            <input
              name="fecha_fin"
              type="date"
              defaultValue={promocion?.fecha_fin ?? undefined}
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container"
            />
          </div>
        </div>
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Planes a los que aplica</label>
          <div className="mt-1 border border-border rounded-lg p-md space-y-2 max-h-48 overflow-y-auto">
            {planes.length === 0 && <p className="text-body-sm text-text-muted">No hay planes cargados todavía.</p>}
            {planes.map((plan) => (
              <label key={plan.id} className="flex items-center gap-2 text-body-sm text-on-surface">
                <input type="checkbox" name="plan_ids" value={plan.id} defaultChecked={planesSeleccionadosIniciales.has(plan.id)} />
                {plan.nombre}
              </label>
            ))}
          </div>
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
            {isPending ? "Guardando..." : "Guardar Promoción"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
