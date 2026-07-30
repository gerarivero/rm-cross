"use client";

import { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { AlumnoConPlan, PlanConPrecio } from "@/lib/supabase/types";
import { reinscribirAlumno } from "./actions";

function formatoMoneda(valor: number | null) {
  if (valor === null) return "sin precio";
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

const inputClass = "mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container";
const labelClass = "font-label-bold text-label-bold text-on-surface-variant";

export function ReinscribirModal({
  alumno,
  planes,
  promociones,
  onClose,
}: {
  alumno: AlumnoConPlan;
  planes: PlanConPrecio[];
  promociones: { id: string; nombre: string; plan_ids: string[] }[];
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [planId, setPlanId] = useState(planes[0]?.id ?? "");
  const [aplicarPromocion, setAplicarPromocion] = useState(false);
  const [precio, setPrecio] = useState<string>(planes[0]?.precio_vigente != null ? String(planes[0].precio_vigente) : "");
  const hoy = new Date().toISOString().slice(0, 10);

  const promocionesDelPlan = useMemo(() => promociones.filter((p) => p.plan_ids.includes(planId)), [promociones, planId]);

  function handlePlanChange(id: string) {
    setPlanId(id);
    const plan = planes.find((p) => p.id === id);
    setPrecio(plan?.precio_vigente != null ? String(plan.precio_vigente) : "");
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await reinscribirAlumno(alumno.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title="Reinscribir Alumno" onClose={onClose}>
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}

      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className={labelClass}>Fecha de inicio *</label>
          <input name="fecha_inicio" type="date" required defaultValue={hoy} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Plan *</label>
          <select name="plan_id" required value={planId} onChange={(e) => handlePlanChange(e.target.value)} className={inputClass}>
            {planes.length === 0 && <option value="">No hay planes activos</option>}
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {formatoMoneda(p.precio_vigente)}
              </option>
            ))}
          </select>
        </div>

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

        {aplicarPromocion && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-md grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className={labelClass}>Promoción</label>
              <select name="promocion_id" className={inputClass}>
                {promocionesDelPlan.length === 0 && <option value="">Ninguna promoción activa para este plan</option>}
                {promocionesDelPlan.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Precio acordado</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-sm pointer-events-none">$</span>
                <input
                  name="precio"
                  type="number"
                  step="0.01"
                  min={1}
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full border border-border rounded-lg pl-7 pr-3 py-2 outline-none focus:border-primary-container"
                />
              </div>
            </div>
          </div>
        )}

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
            {isPending ? "Guardando..." : "Reinscribir"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
