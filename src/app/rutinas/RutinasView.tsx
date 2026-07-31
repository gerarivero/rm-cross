"use client";

import { useMemo, useState, useTransition } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useMobileNav } from "@/components/MobileNavProvider";
import type { RutinaConResumen } from "@/lib/supabase/types";
import { RutinaFormModal } from "./RutinaFormModal";
import { alternarActivoRutina, eliminarRutina } from "./actions";

const PAGE_SIZES = [10, 25, 50] as const;

export function RutinasView({ rutinas }: { rutinas: RutinaConResumen[] }) {
  const { toggleMobileNav } = useMobileNav();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [rutinaEditando, setRutinaEditando] = useState<RutinaConResumen | null>(null);
  const [rutinaEliminando, setRutinaEliminando] = useState<RutinaConResumen | null>(null);

  const filteredRutinas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rutinas;
    return rutinas.filter((r) => r.nombre.toLowerCase().includes(term));
  }, [rutinas, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRutinas.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRutinas = filteredRutinas.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const desde = filteredRutinas.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const hasta = Math.min(currentPage * pageSize, filteredRutinas.length);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleToggleActivo(rutina: RutinaConResumen) {
    setError(null);
    startTransition(async () => {
      const result = await alternarActivoRutina(rutina.id, !rutina.activo);
      if (!result.ok) setError(result.error);
    });
  }

  function handleConfirmarEliminar() {
    if (!rutinaEliminando) return;
    setError(null);
    startTransition(async () => {
      const result = await eliminarRutina(rutinaEliminando.id);
      if (!result.ok) setError(result.error);
      setRutinaEliminando(null);
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex justify-between items-center px-lg py-md w-full">
        <h2 className="font-headline-md text-headline-md text-primary">Rutinas</h2>
        <div className="flex items-center gap-base">
          <div className="hidden lg:flex items-center bg-surface-container-low border border-border rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-container transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-body-sm font-body-sm w-64 outline-none"
              placeholder="Buscar rutinas..."
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="space-y-1">
            <h3 className="font-headline-md text-headline-md text-on-background">Plantillas de Rutina</h3>
            <p className="text-body-sm font-body-sm text-text-muted">
              Mostrando {filteredRutinas.length} de {rutinas.length} rutinas registradas.
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <a
              href="/rutinas/catalogo"
              className="flex items-center gap-xs px-lg py-2.5 border border-border text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-bold text-label-bold"
            >
              <span className="material-symbols-outlined text-[18px]">fitness_center</span>
              Músculos y Ejercicios
            </a>
            <button
              onClick={() => setModalCreateOpen(true)}
              className="flex items-center gap-xs px-lg py-2.5 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity shadow-md font-label-bold text-label-bold"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nueva Rutina
            </button>
          </div>
        </div>

        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-md border-b border-border flex justify-between items-center bg-surface-container-low">
            <h4 className="font-label-bold text-label-bold text-on-surface">Catálogo de Rutinas</h4>
            <div className="flex items-center gap-xs">
              <span className="text-body-sm font-body-sm text-on-surface-variant">Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
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
                  <th className="px-lg py-4 font-label-bold text-label-bold">Rutina</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Alumnos asignados</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedRutinas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      {rutinas.length === 0
                        ? 'Todavía no hay rutinas cargadas. Creá la primera con el botón "Nueva Rutina".'
                        : "Ninguna rutina coincide con la búsqueda."}
                    </td>
                  </tr>
                )}
                {paginatedRutinas.map((rutina, i) => (
                  <tr key={rutina.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                    <td className="px-lg py-4">
                      <p className="font-label-bold text-on-surface">{rutina.nombre}</p>
                      {rutina.descripcion && <p className="text-caption font-caption text-text-muted">{rutina.descripcion}</p>}
                    </td>
                    <td className="px-lg py-4">
                      <a
                        href={`/alumnos?rutina=${rutina.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline font-label-bold text-label-bold"
                        title="Ver alumnos con esta rutina"
                      >
                        <span className="material-symbols-outlined text-[18px]">group</span>
                        {rutina.alumnos_count}
                      </a>
                    </td>
                    <td className="px-lg py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                          rutina.activo ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {rutina.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <a
                          href={`/rutinas/${rutina.id}`}
                          className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                          title="Armar / ver detalle"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </a>
                        <button
                          disabled={isPending}
                          onClick={() => setRutinaEditando(rutina)}
                          className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleToggleActivo(rutina)}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            rutina.activo ? "text-success hover:bg-success/10" : "text-on-surface-variant hover:bg-surface-container"
                          }`}
                          title={rutina.activo ? "Desactivar" : "Reactivar"}
                        >
                          <span className="material-symbols-outlined text-[20px]">{rutina.activo ? "toggle_on" : "toggle_off"}</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => setRutinaEliminando(rutina)}
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
              {filteredRutinas.length === 0 ? "Sin resultados" : `Mostrando ${desde}-${hasta} de ${filteredRutinas.length} resultados`}
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

      {modalCreateOpen && <RutinaFormModal mode="create" onClose={() => setModalCreateOpen(false)} />}
      {rutinaEditando && <RutinaFormModal mode="edit" rutina={rutinaEditando} onClose={() => setRutinaEditando(null)} />}
      {rutinaEliminando && (
        <ConfirmModal
          title="Eliminar rutina"
          message={`¿Eliminar la rutina "${rutinaEliminando.nombre}"? Esta acción no se puede deshacer. Si tiene alumnos asignados (activos o históricos), el sistema va a impedirlo y te va a sugerir desactivarla en su lugar.`}
          confirmLabel="Eliminar"
          danger
          pending={isPending}
          onConfirm={handleConfirmarEliminar}
          onCancel={() => setRutinaEliminando(null)}
        />
      )}
    </>
  );
}
