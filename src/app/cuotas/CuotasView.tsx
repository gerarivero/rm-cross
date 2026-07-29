"use client";

import { useMemo, useState, useTransition } from "react";
import type { ConfiguracionPagos, CuotaConDetalle } from "@/lib/supabase/types";
import { RegistrarPagoModal } from "./RegistrarPagoModal";
import { actualizarConfiguracionPagos } from "./actions";

const PAGE_SIZES = [10, 25, 50] as const;

const ESTADO_ESTILO: Record<string, string> = {
  pagada: "bg-success/10 text-success",
  adeudada: "bg-warning/10 text-warning",
  vencida: "bg-error/10 text-error",
};

const ESTADO_LABEL: Record<string, string> = {
  pagada: "Pagada",
  adeudada: "Adeudada",
  vencida: "Vencida",
};

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatoFecha(valor: string) {
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

export function CuotasView({ cuotas, configuracion }: { cuotas: CuotaConDetalle[]; configuracion: ConfiguracionPagos }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [cuotaPagando, setCuotaPagando] = useState<CuotaConDetalle | null>(null);

  const [configError, setConfigError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resumen = useMemo(() => {
    const acc = { pagada: 0, adeudada: 0, vencida: 0 };
    for (const c of cuotas) acc[c.estado_efectivo as "pagada" | "adeudada" | "vencida"]++;
    return acc;
  }, [cuotas]);

  const filteredCuotas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cuotas;
    return cuotas.filter((c) => {
      const nombreCompleto = `${c.alumno.nombre ?? ""} ${c.alumno.apellido ?? ""}`.toLowerCase();
      return c.alumno.dni.toLowerCase().includes(term) || nombreCompleto.includes(term) || c.plan.nombre.toLowerCase().includes(term);
    });
  }, [cuotas, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCuotas.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedCuotas = filteredCuotas.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const desde = filteredCuotas.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const hasta = Math.min(currentPage * pageSize, filteredCuotas.length);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  function handleGuardarConfiguracion(formData: FormData) {
    setConfigError(null);
    startTransition(async () => {
      const result = await actualizarConfiguracionPagos(formData);
      if (!result.ok) setConfigError(result.error);
    });
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
          <button className="p-2 text-on-surface-variant hover:text-primary-container transition-all duration-200">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      <div className="p-lg space-y-gutter flex-1">
        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
          <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
            <p className="text-on-surface-variant font-label-bold text-label-bold">Pagadas</p>
            <p className="font-display-lg text-display-lg text-success mt-xs">{resumen.pagada}</p>
          </div>
          <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
            <p className="text-on-surface-variant font-label-bold text-label-bold">Adeudadas</p>
            <p className="font-display-lg text-display-lg text-warning mt-xs">{resumen.adeudada}</p>
          </div>
          <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
            <p className="text-on-surface-variant font-label-bold text-label-bold">Vencidas</p>
            <p className="font-display-lg text-display-lg text-error mt-xs">{resumen.vencida}</p>
          </div>
        </div>

        {/* Configuración de Vencimientos y Recargos */}
        <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">rule_settings</span>
            Configuración de Vencimientos y Recargos
          </h3>
          <p className="text-on-surface-variant font-body-sm text-body-sm mb-md">
            Días de gracia después del vencimiento antes de que una cuota pase a <strong>Vencida</strong> y se le aplique recargo.
          </p>
          {configError && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{configError}</div>}
          <form action={handleGuardarConfiguracion} className="grid grid-cols-1 sm:grid-cols-4 gap-md items-end">
            <div>
              <label className="font-label-bold text-label-bold text-on-surface-variant">Días de gracia</label>
              <input
                name="dias_gracia"
                type="number"
                min={0}
                defaultValue={configuracion.dias_gracia}
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 font-data-mono text-data-mono text-center outline-none focus:border-primary-container"
              />
            </div>
            <div>
              <label className="font-label-bold text-label-bold text-on-surface-variant">Tipo de recargo</label>
              <select name="tipo_recargo" defaultValue={configuracion.tipo_recargo} className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container">
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className="font-label-bold text-label-bold text-on-surface-variant">Valor del recargo</label>
              <input
                name="valor_recargo"
                type="number"
                step="0.01"
                min={0}
                defaultValue={configuracion.valor_recargo}
                className="mt-1 w-full border border-border rounded-lg px-3 py-2 font-data-mono text-data-mono outline-none focus:border-primary-container"
              />
            </div>
            <button
              disabled={isPending}
              type="submit"
              className="bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-label-bold text-label-bold shadow-sm hover:opacity-90 transition-all h-fit disabled:opacity-50"
            >
              Guardar Configuración
            </button>
          </form>
        </div>

        {/* Tabla */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-md border-b border-border flex justify-between items-center bg-surface-container-low">
            <h4 className="font-label-bold text-label-bold text-on-surface">Detalle de Cuotas</h4>
            <div className="flex items-center gap-xs">
              <span className="text-body-sm font-body-sm text-on-surface-variant">Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-surface-white border border-border rounded-lg text-caption px-2 py-1 outline-none"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary text-on-secondary">
                  <th className="px-lg py-4 font-label-bold text-label-bold">Alumno</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Plan</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Período</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Vencimiento</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Monto</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Recargo</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedCuotas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      {cuotas.length === 0
                        ? "Todavía no hay cuotas generadas. Se crean automáticamente al dar de alta un alumno con un plan."
                        : "Ninguna cuota coincide con la búsqueda."}
                    </td>
                  </tr>
                )}
                {paginatedCuotas.map((cuota, i) => {
                  const nombreAlumno =
                    cuota.alumno.nombre || cuota.alumno.apellido
                      ? `${cuota.alumno.nombre ?? ""} ${cuota.alumno.apellido ?? ""}`.trim()
                      : `DNI ${cuota.alumno.dni}`;
                  return (
                    <tr key={cuota.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                      <td className="px-lg py-4">
                        <p className="font-label-bold text-on-surface">{nombreAlumno}</p>
                        <p className="text-caption font-caption text-text-muted">DNI {cuota.alumno.dni}</p>
                      </td>
                      <td className="px-lg py-4 text-body-sm text-on-surface-variant">{cuota.plan.nombre}</td>
                      <td className="px-lg py-4 text-body-sm text-on-surface-variant">
                        {formatoFecha(cuota.periodo_desde)} — {formatoFecha(cuota.periodo_hasta)}
                      </td>
                      <td className="px-lg py-4 text-body-sm font-label-bold text-on-surface">{formatoFecha(cuota.fecha_vencimiento)}</td>
                      <td className="px-lg py-4 font-data-mono text-data-mono">{formatoMoneda(cuota.monto_base)}</td>
                      <td className="px-lg py-4 font-data-mono text-data-mono text-error">
                        {cuota.recargo_efectivo > 0 ? `+${formatoMoneda(cuota.recargo_efectivo)}` : "—"}
                      </td>
                      <td className="px-lg py-4">
                        <span className={`px-3 py-1 rounded-full text-caption font-label-bold ${ESTADO_ESTILO[cuota.estado_efectivo]}`}>
                          {ESTADO_LABEL[cuota.estado_efectivo]}
                        </span>
                      </td>
                      <td className="px-lg py-4 text-right">
                        {cuota.estado_efectivo !== "pagada" && (
                          <button
                            onClick={() => setCuotaPagando(cuota)}
                            className="flex items-center gap-1 ml-auto px-3 py-1.5 bg-primary-container text-on-primary-container rounded-lg text-caption font-label-bold hover:opacity-90 transition-opacity"
                          >
                            <span className="material-symbols-outlined text-[16px]">add_card</span>
                            Registrar Pago
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-md border-t border-border flex flex-col md:flex-row justify-between items-center gap-md bg-surface-white">
            <p className="text-caption font-caption text-text-muted">
              {filteredCuotas.length === 0 ? "Sin resultados" : `Mostrando ${desde}-${hasta} de ${filteredCuotas.length} resultados`}
            </p>
            <div className="flex items-center gap-sm">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-border rounded-lg hover:bg-surface-container disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-10 h-10 font-label-bold text-label-bold rounded-lg flex items-center justify-center ${
                    n === currentPage ? "bg-primary-container text-on-primary-container" : "border border-border hover:bg-surface-container"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-border rounded-lg hover:bg-surface-container disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {cuotaPagando && <RegistrarPagoModal cuota={cuotaPagando} onClose={() => setCuotaPagando(null)} />}
    </>
  );
}
