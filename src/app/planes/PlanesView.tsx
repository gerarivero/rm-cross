"use client";

import { useState, useTransition } from "react";
import type { Disciplina, PlanConPrecio } from "@/lib/supabase/types";
import { crearPlan, desactivarPlan, eliminarPlan, reactivarPlan } from "./actions";

function formatoMoneda(valor: number | null) {
  if (valor === null) return "—";
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export function PlanesView({ planes, disciplinas }: { planes: PlanConPrecio[]; disciplinas: Disciplina[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEliminar(planId: string, nombre: string) {
    setError(null);
    if (!confirm(`¿Eliminar el plan "${nombre}"? Esta acción no se puede deshacer.`)) return;

    startTransition(async () => {
      const result = await eliminarPlan(planId);
      if (!result.ok) setError(result.error);
    });
  }

  function handleToggleActivo(planId: string, activo: boolean) {
    setError(null);
    startTransition(async () => {
      const result = activo ? await desactivarPlan(planId) : await reactivarPlan(planId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-gutter">
      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-xl p-md text-body-sm">{error}</div>
      )}

      <div className="bg-surface-white border border-border rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-lg py-md border-b border-border">
          <h3 className="font-headline-md text-headline-md text-on-surface">Catálogo Vigente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary text-on-secondary">
                <th className="px-lg py-4 font-label-bold text-label-bold">Plan</th>
                <th className="px-lg py-4 font-label-bold text-label-bold">Disciplina</th>
                <th className="px-lg py-4 font-label-bold text-label-bold">Frecuencia</th>
                <th className="px-lg py-4 font-label-bold text-label-bold">Precio vigente</th>
                <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {planes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-lg py-lg text-center text-body-sm text-text-muted">
                    Todavía no hay planes cargados. Creá el primero con el formulario de abajo.
                  </td>
                </tr>
              )}
              {planes.map((plan, i) => (
                <tr key={plan.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                  <td className="px-lg py-4 font-label-bold text-on-surface">{plan.nombre}</td>
                  <td className="px-lg py-4 text-body-sm text-on-surface-variant">{plan.disciplina?.nombre ?? "—"}</td>
                  <td className="px-lg py-4">
                    <span className="bg-info/10 text-info px-2 py-1 rounded-full text-caption font-label-bold">
                      {plan.acceso_libre ? "Todos los días" : `${plan.dias_por_semana}x/semana`}
                    </span>
                  </td>
                  <td className="px-lg py-4 font-data-mono text-data-mono">{formatoMoneda(plan.precio_vigente)}</td>
                  <td className="px-lg py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                        plan.activo ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {plan.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-lg py-4 text-right space-x-1">
                    <button
                      disabled={isPending}
                      onClick={() => handleToggleActivo(plan.id, plan.activo)}
                      className="text-primary hover:bg-primary-container/10 p-2 rounded-lg transition-colors disabled:opacity-50"
                      title={plan.activo ? "Desactivar" : "Reactivar"}
                    >
                      <span className="material-symbols-outlined">{plan.activo ? "visibility_off" : "visibility"}</span>
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => handleEliminar(plan.id, plan.nombre)}
                      className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NuevoPlanForm disciplinas={disciplinas} />
    </div>
  );
}

function NuevoPlanForm({ disciplinas }: { disciplinas: Disciplina[] }) {
  const [error, setError] = useState<string | null>(null);
  const [accesoLibre, setAccesoLibre] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await crearPlan(formData);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="bg-surface-white border border-border rounded-xl shadow-sm p-lg max-w-2xl">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">add_circle</span>
        Nuevo Plan
      </h3>
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Disciplina</label>
          <select name="disciplina_id" required className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container">
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Nombre del plan</label>
          <input name="nombre" required placeholder="Ej: Musculación 4x semana" className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container" />
        </div>
        <div className="grid grid-cols-2 gap-md items-end">
          <div>
            <label className="font-label-bold text-label-bold text-on-surface-variant">Frecuencia semanal</label>
            <input
              name="dias_por_semana"
              type="number"
              min={1}
              max={7}
              disabled={accesoLibre}
              placeholder="3"
              className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container disabled:bg-surface-container-low"
            />
            <label className="mt-2 flex items-center gap-2 text-caption font-caption text-on-surface-variant">
              <input type="checkbox" name="acceso_libre" checked={accesoLibre} onChange={(e) => setAccesoLibre(e.target.checked)} />
              Acceso libre (todos los días)
            </label>
          </div>
          <div>
            <label className="font-label-bold text-label-bold text-on-surface-variant">Precio</label>
            <input name="precio" type="number" min={1} step="0.01" required placeholder="15000" className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container" />
          </div>
        </div>
        <div className="flex justify-end gap-sm">
          <button
            disabled={isPending}
            type="submit"
            className="bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-label-bold text-label-bold disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
