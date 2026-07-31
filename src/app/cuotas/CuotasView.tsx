"use client";

import { useMemo, useState } from "react";
import type { CuotaConDetalle } from "@/lib/supabase/types";
import { useMobileNav } from "@/components/MobileNavProvider";
import { CuotasTable } from "./CuotasTable";
import { RegistrarPagoModal } from "./RegistrarPagoModal";
import { DetallePagosModal } from "./DetallePagosModal";

type EstadoResumen = "pagada" | "adeudada" | "vencida";

const RESUMEN_CARDS: { estado: EstadoResumen; label: string; colorTexto: string; colorAnillo: string }[] = [
  { estado: "pagada", label: "Pagadas", colorTexto: "text-success", colorAnillo: "ring-success" },
  { estado: "adeudada", label: "Adeudadas", colorTexto: "text-warning", colorAnillo: "ring-warning" },
  { estado: "vencida", label: "Vencidas", colorTexto: "text-error", colorAnillo: "ring-error" },
];

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export function CuotasView({ cuotas }: { cuotas: CuotaConDetalle[] }) {
  const { toggleMobileNav } = useMobileNav();
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoResumen | null>(null);
  const [cuotaPagando, setCuotaPagando] = useState<CuotaConDetalle | null>(null);
  const [cuotaDetalle, setCuotaDetalle] = useState<CuotaConDetalle | null>(null);

  const resumen = useMemo(() => {
    const acc: Record<EstadoResumen, { cantidad: number; monto: number }> = {
      pagada: { cantidad: 0, monto: 0 },
      adeudada: { cantidad: 0, monto: 0 },
      vencida: { cantidad: 0, monto: 0 },
    };
    for (const c of cuotas) {
      const estado = c.estado_efectivo as EstadoResumen;
      acc[estado].cantidad++;
      acc[estado].monto += estado === "pagada" ? c.total_pagado : c.total_adeudado;
    }
    return acc;
  }, [cuotas]);

  const filteredCuotas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cuotas.filter((c) => {
      if (estadoFiltro && c.estado_efectivo !== estadoFiltro) return false;
      if (!term) return true;
      const nombreCompleto = `${c.alumno.nombre ?? ""} ${c.alumno.apellido ?? ""}`.toLowerCase();
      return c.alumno.dni.toLowerCase().includes(term) || nombreCompleto.includes(term) || c.plan.nombre.toLowerCase().includes(term);
    });
  }, [cuotas, search, estadoFiltro]);

  function handleSearchChange(value: string) {
    setSearch(value);
  }

  function handleToggleEstadoFiltro(estado: EstadoResumen) {
    setEstadoFiltro((actual) => (actual === estado ? null : estado));
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex justify-between items-center px-lg py-md w-full">
        <h2 className="font-headline-md text-headline-md text-primary">Control de Cuotas</h2>
        <div className="flex items-center gap-base">
          <div className="hidden lg:flex items-center bg-surface-container-low border border-border rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-container transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-body-sm font-body-sm w-64 outline-none"
              placeholder="Buscar por alumno, DNI o plan..."
              type="text"
            />
          </div>
          <a
            href="/cuotas/historico"
            className="flex items-center gap-xs px-lg py-2.5 border border-border text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-bold text-label-bold"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Ver Histórico
          </a>
          <a
            href="/configuracion"
            className="flex items-center gap-xs px-lg py-2.5 border border-border text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-bold text-label-bold"
            title="Configurar días de gracia y recargo por mora"
          >
            <span className="material-symbols-outlined text-[18px]">rule_settings</span>
            Configurar Mora
          </a>
          <button
            onClick={toggleMobileNav}
            className="md:hidden p-2 text-on-surface-variant hover:text-primary-container transition-all duration-200"
            title="Abrir menú"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      <div className="p-lg space-y-gutter flex-1">
        <p className="text-body-sm font-body-sm text-text-muted">
          Mostrando las cuotas con vencimiento en el mes actual. Para ver otros períodos, usá &quot;Ver Histórico&quot;.
        </p>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
          {RESUMEN_CARDS.map(({ estado, label, colorTexto, colorAnillo }) => {
            const activa = estadoFiltro === estado;
            return (
              <button
                key={estado}
                onClick={() => handleToggleEstadoFiltro(estado)}
                className={`text-left bg-surface-white border border-border rounded-xl p-lg shadow-sm transition-all hover:shadow-md ${
                  activa ? `ring-2 ${colorAnillo}` : ""
                }`}
              >
                <p className="text-on-surface-variant font-label-bold text-label-bold">{label}</p>
                <p className={`font-display-lg text-display-lg mt-xs ${colorTexto}`}>{resumen[estado].cantidad}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">{formatoMoneda(resumen[estado].monto)}</p>
              </button>
            );
          })}
        </div>

        <CuotasTable
          cuotas={filteredCuotas}
          totalSinFiltrar={cuotas.length}
          mensajeVacio='Todavía no hay cuotas con vencimiento este mes. Se crean automáticamente al dar de alta un alumno con un plan, o al pagarse la cuota del período anterior.'
          onRegistrarPago={setCuotaPagando}
          onVerDetalle={setCuotaDetalle}
        />
      </div>

      {cuotaPagando && <RegistrarPagoModal cuota={cuotaPagando} onClose={() => setCuotaPagando(null)} />}
      {cuotaDetalle && <DetallePagosModal cuota={cuotaDetalle} onClose={() => setCuotaDetalle(null)} />}
    </>
  );
}
