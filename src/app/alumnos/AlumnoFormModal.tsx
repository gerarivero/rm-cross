"use client";

import { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { AlumnoConPlan, PlanConPrecio, Turno } from "@/lib/supabase/types";
import { actualizarAlumno, crearAlumno } from "./actions";

const ESTADOS = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "suspendido", label: "Suspendido" },
  { value: "de_baja", label: "De baja" },
];

function formatoMoneda(valor: number | null) {
  if (valor === null) return "sin precio";
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

const inputClass = "mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container";
const labelClass = "font-label-bold text-label-bold text-on-surface-variant";

export function AlumnoFormModal({
  mode,
  alumno,
  planes,
  turnos,
  promociones,
  onClose,
}: {
  mode: "create" | "edit";
  alumno?: AlumnoConPlan;
  planes: PlanConPrecio[];
  turnos: Turno[];
  promociones: { id: string; nombre: string; plan_ids: string[] }[];
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [planId, setPlanId] = useState(planes[0]?.id ?? "");
  const [aplicarPromocion, setAplicarPromocion] = useState(false);
  const [precio, setPrecio] = useState<string>(planes[0]?.precio_vigente != null ? String(planes[0].precio_vigente) : "");

  const promocionesDelPlan = useMemo(
    () => promociones.filter((p) => p.plan_ids.includes(planId)),
    [promociones, planId]
  );

  function handlePlanChange(id: string) {
    setPlanId(id);
    const plan = planes.find((p) => p.id === id);
    setPrecio(plan?.precio_vigente != null ? String(plan.precio_vigente) : "");
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = mode === "edit" && alumno ? await actualizarAlumno(alumno.id, formData) : await crearAlumno(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal title={mode === "edit" ? "Editar Alumno" : "Nuevo Alumno"} onClose={onClose} maxWidth="max-w-2xl">
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}
      <form action={handleSubmit} className="space-y-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label className={labelClass}>DNI *</label>
            <input name="dni" required defaultValue={alumno?.dni} placeholder="30123456" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nombre</label>
            <input name="nombre" defaultValue={alumno?.nombre ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Apellido</label>
            <input name="apellido" defaultValue={alumno?.apellido ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fecha de nacimiento</label>
            <input name="fecha_nacimiento" type="date" defaultValue={alumno?.fecha_nacimiento ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" defaultValue={alumno?.email ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Celular</label>
            <input name="celular" defaultValue={alumno?.celular ?? undefined} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Turno</label>
            <select name="turno_id" defaultValue={alumno?.turno_id ?? ""} className={inputClass}>
              <option value="">Sin turno</option>
              {turnos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className={labelClass}>Altura (cm)</label>
              <input name="altura" type="number" step="0.1" defaultValue={alumno?.altura ?? undefined} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Peso (kg)</label>
              <input name="peso" type="number" step="0.1" defaultValue={alumno?.peso ?? undefined} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-md">
          <p className={`${labelClass} mb-2`}>Fotos de progreso</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className={labelClass}>Foto inicial</label>
              {alumno?.foto_inicial_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={alumno.foto_inicial_url} alt="Foto inicial actual" className="mt-1 w-20 h-20 object-cover rounded-lg border border-border" />
              )}
              <input name="foto_inicial" type="file" accept="image/*" className={`${inputClass} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-surface-container-low file:text-caption`} />
            </div>
            <div>
              <label className={labelClass}>Foto actual</label>
              {alumno?.foto_actual_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={alumno.foto_actual_url} alt="Foto actual" className="mt-1 w-20 h-20 object-cover rounded-lg border border-border" />
              )}
              <input name="foto_actual" type="file" accept="image/*" className={`${inputClass} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-surface-container-low file:text-caption`} />
            </div>
          </div>
        </div>

        {mode === "edit" && (
          <div>
            <label className={labelClass}>Estado</label>
            <select name="estado" defaultValue={alumno?.estado} className={inputClass}>
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === "create" && (
          <div className="border-t border-border pt-md space-y-md">
            <div>
              <label className={labelClass}>Plan *</label>
              <select
                name="plan_id"
                required
                value={planId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className={inputClass}
              >
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
            )}
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
            {isPending ? "Guardando..." : "Guardar Alumno"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
