"use client";

import { useState } from "react";
import { useMobileNav } from "@/components/MobileNavProvider";
import type { EventoDashboard, ResumenAlumnos, ResumenCuotasMes, TipoEvento } from "./data";

const PAGE_SIZES = [10, 25, 50] as const;

const TIPO_EVENTO_LABEL: Record<TipoEvento, string> = {
  cuota_vencida: "Cuota vencida",
  cuota_adeudada: "Cuota a cobrar",
  revision_rutina: "Revisar rutina",
  aniversario: "Aniversario",
};

const TIPO_EVENTO_ESTILO: Record<TipoEvento, string> = {
  cuota_vencida: "bg-error/10 text-error",
  cuota_adeudada: "bg-warning/10 text-warning",
  revision_rutina: "bg-warning/10 text-warning",
  aniversario: "bg-success/10 text-success",
};

const TIPO_EVENTO_ICONO: Record<TipoEvento, string> = {
  cuota_vencida: "error",
  cuota_adeudada: "payments",
  revision_rutina: "fitness_center",
  aniversario: "celebration",
};

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatoFecha(valor: string) {
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

export function DashboardView({
  resumenAlumnos,
  resumenCuotas,
  eventos,
}: {
  resumenAlumnos: ResumenAlumnos;
  resumenCuotas: ResumenCuotasMes;
  eventos: EventoDashboard[];
}) {
  const { toggleMobileNav } = useMobileNav();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);

  const totalPages = Math.max(1, Math.ceil(eventos.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedEventos = eventos.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const desde = eventos.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const hasta = Math.min(currentPage * pageSize, eventos.length);

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  const diferencialTexto =
    resumenAlumnos.diferencial === 0
      ? "Sin cambios"
      : `${resumenAlumnos.diferencial > 0 ? "+" : ""}${resumenAlumnos.diferencial} vs. mes pasado`;
  const diferencialColor =
    resumenAlumnos.diferencial > 0 ? "text-success" : resumenAlumnos.diferencial < 0 ? "text-error" : "text-on-surface-variant";

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex justify-between items-center px-lg py-md w-full">
        <h2 className="font-headline-md text-headline-md text-primary">Dashboard</h2>
        <button
          onClick={toggleMobileNav}
          className="md:hidden p-2 text-on-surface-variant hover:text-primary-container transition-all duration-200"
          title="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      <div className="p-lg space-y-gutter flex-1">
        {/* Cards de resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
            <p className="text-on-surface-variant font-label-bold text-label-bold">Total de Alumnos</p>
            <p className="font-display-lg text-display-lg text-primary mt-xs">{resumenAlumnos.total}</p>
          </div>
          <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
            <p className="text-on-surface-variant font-label-bold text-label-bold">Altas este mes</p>
            <p className="font-display-lg text-display-lg text-on-surface mt-xs">{resumenAlumnos.altasEsteMes}</p>
            <p className={`text-body-sm font-body-sm mt-1 ${diferencialColor}`}>{diferencialTexto}</p>
          </div>
          <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
            <p className="text-on-surface-variant font-label-bold text-label-bold">Saldo de Deuda del Mes</p>
            <p className="font-display-lg text-display-lg text-error mt-xs">{formatoMoneda(resumenCuotas.saldoDeuda)}</p>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">Cuotas adeudadas + vencidas</p>
          </div>
          <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
            <p className="text-on-surface-variant font-label-bold text-label-bold">Cobrado este Mes</p>
            <p className="font-display-lg text-display-lg text-success mt-xs">{formatoMoneda(resumenCuotas.cobradoEsteMes)}</p>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">Cuotas pagadas del mes</p>
          </div>
        </div>

        {/* Tabla de eventos */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-md border-b border-border flex justify-between items-center bg-surface-container-low">
            <h4 className="font-label-bold text-label-bold text-on-surface">Eventos Próximos</h4>
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
                  <th className="px-lg py-4 font-label-bold text-label-bold">Tipo</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Alumno</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Descripción</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Fecha</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedEventos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      No hay eventos pendientes por ahora.
                    </td>
                  </tr>
                )}
                {paginatedEventos.map((evento, i) => (
                  <tr key={`${evento.tipo}-${evento.alumno.id}-${evento.fecha}-${i}`} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                    <td className="px-lg py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-caption font-label-bold ${TIPO_EVENTO_ESTILO[evento.tipo]}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{TIPO_EVENTO_ICONO[evento.tipo]}</span>
                        {TIPO_EVENTO_LABEL[evento.tipo]}
                      </span>
                    </td>
                    <td className="px-lg py-4">
                      <p className="font-label-bold text-on-surface">{evento.alumno.nombre}</p>
                      <p className="text-caption font-caption text-text-muted">DNI {evento.alumno.dni}</p>
                    </td>
                    <td className="px-lg py-4 text-body-sm text-on-surface-variant">{evento.descripcion}</td>
                    <td className="px-lg py-4 text-body-sm font-label-bold text-on-surface">{formatoFecha(evento.fecha)}</td>
                    <td className="px-lg py-4 text-right">
                      <a
                        href={evento.href}
                        className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors inline-block"
                        title="Ver"
                      >
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-md border-t border-border flex flex-col md:flex-row justify-between items-center gap-md bg-surface-white">
            <p className="text-caption font-caption text-text-muted">
              {eventos.length === 0 ? "Sin resultados" : `Mostrando ${desde}-${hasta} de ${eventos.length} resultados`}
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
    </>
  );
}
