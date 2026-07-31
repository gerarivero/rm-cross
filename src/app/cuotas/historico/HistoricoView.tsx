"use client";

import { useMemo, useState } from "react";
import { useMobileNav } from "@/components/MobileNavProvider";
import type { CuotaConDetalle, PlanConPrecio } from "@/lib/supabase/types";
import { CuotasTable } from "../CuotasTable";
import { DetallePagosModal } from "../DetallePagosModal";
import { RegistrarPagoModal } from "../RegistrarPagoModal";

const inputClass = "mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container text-body-sm";
const labelClass = "font-label-bold text-label-bold text-on-surface-variant";

export function HistoricoView({ cuotas, planes }: { cuotas: CuotaConDetalle[]; planes: PlanConPrecio[] }) {
  const { toggleMobileNav } = useMobileNav();
  const [alumno, setAlumno] = useState("");
  const [dni, setDni] = useState("");
  const [planId, setPlanId] = useState("");
  const [periodoDesde, setPeriodoDesde] = useState("");
  const [periodoHasta, setPeriodoHasta] = useState("");

  const [cuotaPagando, setCuotaPagando] = useState<CuotaConDetalle | null>(null);
  const [cuotaDetalle, setCuotaDetalle] = useState<CuotaConDetalle | null>(null);

  const filteredCuotas = useMemo(() => {
    const alumnoTerm = alumno.trim().toLowerCase();
    const dniTerm = dni.trim().toLowerCase();

    return cuotas.filter((c) => {
      if (alumnoTerm) {
        const nombreCompleto = `${c.alumno.nombre ?? ""} ${c.alumno.apellido ?? ""}`.toLowerCase();
        if (!nombreCompleto.includes(alumnoTerm)) return false;
      }
      if (dniTerm && !c.alumno.dni.toLowerCase().includes(dniTerm)) return false;
      if (planId && c.plan.id !== planId) return false;
      if (periodoDesde && c.periodo_desde < periodoDesde) return false;
      if (periodoHasta && c.periodo_desde > periodoHasta) return false;
      return true;
    });
  }, [cuotas, alumno, dni, planId, periodoDesde, periodoHasta]);

  function limpiarFiltros() {
    setAlumno("");
    setDni("");
    setPlanId("");
    setPeriodoDesde("");
    setPeriodoHasta("");
  }

  const hayFiltros = Boolean(alumno || dni || planId || periodoDesde || periodoHasta);

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex items-center justify-between gap-md px-lg py-md w-full">
        <div className="flex items-center gap-md">
          <a href="/cuotas" className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors" title="Volver a Cuotas">
            <span className="material-symbols-outlined">arrow_back</span>
          </a>
          <h2 className="font-headline-md text-headline-md text-primary">Histórico de Cuotas</h2>
        </div>
        <button
          onClick={toggleMobileNav}
          className="md:hidden p-2 text-on-surface-variant hover:text-primary-container transition-all duration-200"
          title="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      <div className="p-lg space-y-gutter flex-1">
        <div className="bg-surface-white border border-border rounded-xl shadow-sm p-lg">
          <div className="flex items-center justify-between mb-md">
            <h3 className="font-headline-md text-headline-md text-on-background">Filtros</h3>
            {hayFiltros && (
              <button onClick={limpiarFiltros} className="text-caption font-caption text-primary hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-md">
            <div>
              <label className={labelClass}>Alumno</label>
              <input value={alumno} onChange={(e) => setAlumno(e.target.value)} placeholder="Nombre o apellido" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>DNI</label>
              <input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="DNI" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Plan</label>
              <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={inputClass}>
                <option value="">Todos los planes</option>
                {planes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Período desde</label>
              <input type="date" value={periodoDesde} onChange={(e) => setPeriodoDesde(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Período hasta</label>
              <input type="date" value={periodoHasta} onChange={(e) => setPeriodoHasta(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <CuotasTable
          cuotas={filteredCuotas}
          totalSinFiltrar={cuotas.length}
          mensajeVacio="Todavía no hay cuotas generadas."
          onRegistrarPago={setCuotaPagando}
          onVerDetalle={setCuotaDetalle}
        />
      </div>

      {cuotaPagando && <RegistrarPagoModal cuota={cuotaPagando} onClose={() => setCuotaPagando(null)} />}
      {cuotaDetalle && <DetallePagosModal cuota={cuotaDetalle} onClose={() => setCuotaDetalle(null)} />}
    </>
  );
}
