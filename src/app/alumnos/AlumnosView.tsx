"use client";

import { useMemo, useState } from "react";
import type { AlumnoConPlan, PlanConPrecio, Turno } from "@/lib/supabase/types";
import { AlumnoFormModal } from "./AlumnoFormModal";

const PAGE_SIZES = [10, 25, 50] as const;

const ESTADO_ESTILO: Record<string, string> = {
  activo: "bg-success/10 text-success",
  inactivo: "bg-surface-container-high text-on-surface-variant",
  suspendido: "bg-warning/10 text-warning",
  de_baja: "bg-error/10 text-error",
};

const ESTADO_LABEL: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  suspendido: "Suspendido",
  de_baja: "De baja",
};

function formatoMoneda(valor: number | null) {
  if (valor === null) return "—";
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export function AlumnosView({
  alumnos,
  planes,
  turnos,
  promociones,
  planFiltroInicial,
}: {
  alumnos: AlumnoConPlan[];
  planes: PlanConPrecio[];
  turnos: Turno[];
  promociones: { id: string; nombre: string; plan_ids: string[] }[];
  planFiltroInicial: string | null;
}) {
  const [search, setSearch] = useState("");
  const [planFiltro, setPlanFiltro] = useState<string | null>(planFiltroInicial);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);

  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [alumnoEditando, setAlumnoEditando] = useState<AlumnoConPlan | null>(null);

  const planFiltroNombre = planFiltro ? planes.find((p) => p.id === planFiltro)?.nombre ?? "Plan" : null;

  const filteredAlumnos = useMemo(() => {
    let lista = alumnos;
    if (planFiltro) lista = lista.filter((a) => a.plan?.id === planFiltro);

    const term = search.trim().toLowerCase();
    if (term) {
      lista = lista.filter((a) => {
        const nombreCompleto = `${a.nombre ?? ""} ${a.apellido ?? ""}`.toLowerCase();
        return a.dni.toLowerCase().includes(term) || nombreCompleto.includes(term);
      });
    }
    return lista;
  }, [alumnos, planFiltro, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAlumnos.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedAlumnos = filteredAlumnos.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const desde = filteredAlumnos.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const hasta = Math.min(currentPage * pageSize, filteredAlumnos.length);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  function limpiarFiltroPlan() {
    setPlanFiltro(null);
    setPage(1);
    window.history.replaceState(null, "", "/alumnos");
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex justify-between items-center px-lg py-md w-full">
        <h2 className="font-headline-md text-headline-md text-primary">Gestión de Alumnos</h2>
        <div className="flex items-center gap-base">
          <div className="hidden lg:flex items-center bg-surface-container-low border border-border rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-container transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-body-sm font-body-sm w-64 outline-none"
              placeholder="Buscar por DNI o nombre..."
              type="text"
            />
          </div>
          <button className="p-2 text-on-surface-variant hover:text-primary-container transition-all duration-200">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      <div className="p-lg space-y-gutter flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="space-y-1">
            <h3 className="font-headline-md text-headline-md text-on-background">Listado General</h3>
            <p className="text-body-sm font-body-sm text-text-muted">
              Mostrando {filteredAlumnos.length} de {alumnos.length} alumnos registrados.
            </p>
          </div>
          <button
            onClick={() => setModalCreateOpen(true)}
            className="flex items-center gap-xs px-lg py-2.5 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity shadow-md font-label-bold text-label-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Alumno
          </button>
        </div>

        {planFiltro && (
          <div className="inline-flex items-center gap-2 bg-info/10 text-info px-3 py-1.5 rounded-full text-caption font-label-bold">
            Filtrando por plan: {planFiltroNombre}
            <button onClick={limpiarFiltroPlan} className="hover:opacity-70" title="Quitar filtro">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-md border-b border-border flex justify-between items-center bg-surface-container-low">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary text-on-secondary">
                  <th className="px-lg py-4 font-label-bold text-label-bold">DNI</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Alumno</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Plan</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Turno</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedAlumnos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      {alumnos.length === 0
                        ? "Todavía no hay alumnos cargados. Creá el primero con el botón \"Nuevo Alumno\"."
                        : "Ningún alumno coincide con la búsqueda/filtro."}
                    </td>
                  </tr>
                )}
                {paginatedAlumnos.map((alumno, i) => (
                  <tr key={alumno.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                    <td className="px-lg py-4 font-data-mono text-data-mono text-on-surface">{alumno.dni}</td>
                    <td className="px-lg py-4">
                      <p className="font-label-bold text-on-surface">
                        {alumno.nombre || alumno.apellido ? `${alumno.nombre ?? ""} ${alumno.apellido ?? ""}`.trim() : "(sin nombre)"}
                      </p>
                      {alumno.email && <p className="text-caption font-caption text-text-muted">{alumno.email}</p>}
                    </td>
                    <td className="px-lg py-4 text-body-sm text-on-surface-variant">
                      {alumno.plan ? (
                        <>
                          {alumno.plan.nombre}
                          <span className="block text-caption font-data-mono text-data-mono text-text-muted">
                            {formatoMoneda(alumno.precio)}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-lg py-4 text-body-sm text-on-surface-variant">{alumno.turno?.nombre ?? "—"}</td>
                    <td className="px-lg py-4">
                      <span className={`px-3 py-1 rounded-full text-caption font-label-bold ${ESTADO_ESTILO[alumno.estado]}`}>
                        {ESTADO_LABEL[alumno.estado]}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <button
                        onClick={() => setAlumnoEditando(alumno)}
                        className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-md border-t border-border flex flex-col md:flex-row justify-between items-center gap-md bg-surface-white">
            <p className="text-caption font-caption text-text-muted">
              {filteredAlumnos.length === 0 ? "Sin resultados" : `Mostrando ${desde}-${hasta} de ${filteredAlumnos.length} resultados`}
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

      {modalCreateOpen && (
        <AlumnoFormModal mode="create" planes={planes} turnos={turnos} promociones={promociones} onClose={() => setModalCreateOpen(false)} />
      )}
      {alumnoEditando && (
        <AlumnoFormModal
          mode="edit"
          alumno={alumnoEditando}
          planes={planes}
          turnos={turnos}
          promociones={promociones}
          onClose={() => setAlumnoEditando(null)}
        />
      )}
    </>
  );
}
