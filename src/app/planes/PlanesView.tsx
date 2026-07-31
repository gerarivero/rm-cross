"use client";

import { useMemo, useState, useTransition } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useMobileNav } from "@/components/MobileNavProvider";
import type { Disciplina, PlanConPrecio } from "@/lib/supabase/types";
import { PlanFormModal } from "./PlanFormModal";
import { desactivarPlan, eliminarPlan, reactivarPlan } from "./actions";

const PAGE_SIZES = [10, 25, 50] as const;

function formatoMoneda(valor: number | null) {
  if (valor === null) return "—";
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export function PlanesView({ planes, disciplinas }: { planes: PlanConPrecio[]; disciplinas: Disciplina[] }) {
  const { toggleMobileNav } = useMobileNav();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [planEditando, setPlanEditando] = useState<PlanConPrecio | null>(null);
  const [planEliminando, setPlanEliminando] = useState<PlanConPrecio | null>(null);

  const filteredPlanes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return planes;
    return planes.filter(
      (p) => p.nombre.toLowerCase().includes(term) || (p.disciplina?.nombre ?? "").toLowerCase().includes(term)
    );
  }, [planes, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPlanes.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedPlanes = filteredPlanes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const desde = filteredPlanes.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const hasta = Math.min(currentPage * pageSize, filteredPlanes.length);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  function handleToggleActivo(plan: PlanConPrecio) {
    setError(null);
    startTransition(async () => {
      const result = plan.activo ? await desactivarPlan(plan.id) : await reactivarPlan(plan.id);
      if (!result.ok) setError(result.error);
    });
  }

  function handleConfirmarEliminar() {
    if (!planEliminando) return;
    setError(null);
    startTransition(async () => {
      const result = await eliminarPlan(planEliminando.id);
      if (!result.ok) setError(result.error);
      setPlanEliminando(null);
    });
  }

  return (
    <>
      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex justify-between items-center px-lg py-md w-full">
        <h2 className="font-headline-md text-headline-md text-primary">Gestión de Planes</h2>
        <div className="flex items-center gap-base">
          <div className="hidden lg:flex items-center bg-surface-container-low border border-border rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-container transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-body-sm font-body-sm w-64 outline-none"
              placeholder="Buscar planes..."
              type="text"
            />
          </div>
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
        {error && <div className="bg-error/10 border border-error/30 text-error rounded-xl p-md text-body-sm">{error}</div>}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="space-y-1">
            <h3 className="font-headline-md text-headline-md text-on-background">Catálogo de Planes</h3>
            <p className="text-body-sm font-body-sm text-text-muted">
              Mostrando {filteredPlanes.length} de {planes.length} planes registrados.
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <a
              href="/planes/promociones"
              className="flex items-center gap-xs px-lg py-2.5 border border-border text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-bold text-label-bold"
            >
              <span className="material-symbols-outlined text-[18px]">local_offer</span>
              Promociones
            </a>
            <button
              onClick={() => setModalCreateOpen(true)}
              className="flex items-center gap-xs px-lg py-2.5 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity shadow-md font-label-bold text-label-bold"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo Plan
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-md border-b border-border flex justify-between items-center bg-surface-container-low">
            <h4 className="font-label-bold text-label-bold text-on-surface">Catálogo Vigente</h4>
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
                  <th className="px-lg py-4 font-label-bold text-label-bold">Plan</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Disciplina</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Frecuencia</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Precio vigente</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Alumnos</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedPlanes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      {planes.length === 0
                        ? "Todavía no hay planes cargados. Creá el primero con el botón \"Nuevo Plan\"."
                        : "Ningún plan coincide con la búsqueda."}
                    </td>
                  </tr>
                )}
                {paginatedPlanes.map((plan, i) => (
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
                      <a
                        href={`/alumnos?plan=${plan.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-label-bold text-label-bold"
                        title="Ver alumnos de este plan"
                      >
                        <span className="material-symbols-outlined text-[18px]">group</span>
                        {plan.alumnos_count}
                      </a>
                    </td>
                    <td className="px-lg py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                          plan.activo ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {plan.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <a
                          href={`/planes/${plan.id}`}
                          className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </a>
                        <button
                          disabled={isPending}
                          onClick={() => setPlanEditando(plan)}
                          className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleToggleActivo(plan)}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            plan.activo ? "text-success hover:bg-success/10" : "text-on-surface-variant hover:bg-surface-container"
                          }`}
                          title={plan.activo ? "Desactivar" : "Reactivar"}
                        >
                          <span className="material-symbols-outlined text-[20px]">{plan.activo ? "toggle_on" : "toggle_off"}</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => setPlanEliminando(plan)}
                          className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-md border-t border-border flex flex-col md:flex-row justify-between items-center gap-md bg-surface-white">
            <p className="text-caption font-caption text-text-muted">
              {filteredPlanes.length === 0
                ? "Sin resultados"
                : `Mostrando ${desde}-${hasta} de ${filteredPlanes.length} resultados`}
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
                    n === currentPage
                      ? "bg-primary-container text-on-primary-container"
                      : "border border-border hover:bg-surface-container"
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
        <PlanFormModal mode="create" disciplinas={disciplinas} onClose={() => setModalCreateOpen(false)} />
      )}
      {planEditando && (
        <PlanFormModal mode="edit" disciplinas={disciplinas} plan={planEditando} onClose={() => setPlanEditando(null)} />
      )}
      {planEliminando && (
        <ConfirmModal
          title="Eliminar plan"
          message={`¿Eliminar el plan "${planEliminando.nombre}"? Esta acción no se puede deshacer. Si tiene alumnos inscriptos (activos o históricos), el sistema va a impedirlo y te va a sugerir desactivarlo en su lugar.`}
          confirmLabel="Eliminar"
          danger
          pending={isPending}
          onConfirm={handleConfirmarEliminar}
          onCancel={() => setPlanEliminando(null)}
        />
      )}
    </>
  );
}
