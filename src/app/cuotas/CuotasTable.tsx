"use client";

import { useState } from "react";
import type { CuotaConDetalle } from "@/lib/supabase/types";

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

// Tabla + paginación de cuotas, compartida por CuotasView (mes actual) y
// HistoricoView (todas las cuotas) — recibe las filas ya filtradas por el padre.
export function CuotasTable({
  cuotas,
  totalSinFiltrar,
  mensajeVacio,
  onRegistrarPago,
  onVerDetalle,
}: {
  cuotas: CuotaConDetalle[];
  totalSinFiltrar: number;
  mensajeVacio: string;
  onRegistrarPago: (cuota: CuotaConDetalle) => void;
  onVerDetalle: (cuota: CuotaConDetalle) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);

  const totalPages = Math.max(1, Math.ceil(cuotas.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedCuotas = cuotas.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const desde = cuotas.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const hasta = Math.min(currentPage * pageSize, cuotas.length);

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  return (
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
              <th className="px-lg py-4 font-label-bold text-label-bold">Saldo</th>
              <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
              <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedCuotas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-lg py-lg text-center text-body-sm text-text-muted">
                  {totalSinFiltrar === 0 ? mensajeVacio : "Ninguna cuota coincide con la búsqueda."}
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
                  <td className="px-lg py-4 font-data-mono text-data-mono">
                    {cuota.estado_efectivo === "pagada" ? (
                      <span className="text-success">Pagada</span>
                    ) : (
                      formatoMoneda(cuota.total_adeudado)
                    )}
                  </td>
                  <td className="px-lg py-4">
                    <span className={`px-3 py-1 rounded-full text-caption font-label-bold ${ESTADO_ESTILO[cuota.estado_efectivo]}`}>
                      {ESTADO_LABEL[cuota.estado_efectivo]}
                    </span>
                  </td>
                  <td className="px-lg py-4">
                    <div className="flex items-center justify-end gap-1">
                      {cuota.estado_efectivo !== "pagada" && (
                        <button
                          onClick={() => onRegistrarPago(cuota)}
                          title="Registrar Pago"
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">payments</span>
                        </button>
                      )}
                      <button
                        onClick={() => onVerDetalle(cuota)}
                        title="Ver Detalle"
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                      {cuota.estado_efectivo === "pagada" && (
                        <a
                          href={`/cuotas/${cuota.id}/comprobante`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Generar Comprobante"
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-md border-t border-border flex flex-col md:flex-row justify-between items-center gap-md bg-surface-white">
        <p className="text-caption font-caption text-text-muted">
          {cuotas.length === 0 ? "Sin resultados" : `Mostrando ${desde}-${hasta} de ${cuotas.length} resultados`}
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
  );
}
