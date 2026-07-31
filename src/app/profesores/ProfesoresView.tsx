"use client";

import { useMemo, useState, useTransition } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useMobileNav } from "@/components/MobileNavProvider";
import type { Disciplina, ProfesorConDisciplinas } from "@/lib/supabase/types";
import { ProfesorFormModal } from "./ProfesorFormModal";
import { desactivarProfesor, eliminarProfesor, reactivarProfesor } from "./actions";

const PAGE_SIZES = [10, 25, 50] as const;

function formatoFecha(valor: string | null) {
  if (!valor) return "—";
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

export function ProfesoresView({ profesores, disciplinas }: { profesores: ProfesorConDisciplinas[]; disciplinas: Disciplina[] }) {
  const { toggleMobileNav } = useMobileNav();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [profesorEditando, setProfesorEditando] = useState<ProfesorConDisciplinas | null>(null);
  const [profesorEliminando, setProfesorEliminando] = useState<ProfesorConDisciplinas | null>(null);

  const filteredProfesores = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return profesores;
    return profesores.filter((p) => {
      const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
      return p.dni.toLowerCase().includes(term) || nombreCompleto.includes(term);
    });
  }, [profesores, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProfesores.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedProfesores = filteredProfesores.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const desde = filteredProfesores.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const hasta = Math.min(currentPage * pageSize, filteredProfesores.length);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  function handleToggleActivo(profesor: ProfesorConDisciplinas) {
    setError(null);
    startTransition(async () => {
      const result = profesor.activo ? await desactivarProfesor(profesor.id) : await reactivarProfesor(profesor.id);
      if (!result.ok) setError(result.error);
    });
  }

  function handleConfirmarEliminar() {
    if (!profesorEliminando) return;
    setError(null);
    startTransition(async () => {
      const result = await eliminarProfesor(profesorEliminando.id);
      if (!result.ok) setError(result.error);
      setProfesorEliminando(null);
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex justify-between items-center px-lg py-md w-full">
        <h2 className="font-headline-md text-headline-md text-primary">Gestión de Profesores</h2>
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
            <h3 className="font-headline-md text-headline-md text-on-background">Listado General</h3>
            <p className="text-body-sm font-body-sm text-text-muted">
              Mostrando {filteredProfesores.length} de {profesores.length} profesores registrados.
            </p>
          </div>
          <button
            onClick={() => setModalCreateOpen(true)}
            className="flex items-center gap-xs px-lg py-2.5 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity shadow-md font-label-bold text-label-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Profesor
          </button>
        </div>

        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-md border-b border-border flex justify-between items-center bg-surface-container-low">
            <h4 className="font-label-bold text-label-bold text-on-surface">Profesores</h4>
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
                  <th className="px-lg py-4 font-label-bold text-label-bold">Profesor</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">DNI</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Disciplinas</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Contacto</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedProfesores.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      {profesores.length === 0
                        ? "Todavía no hay profesores cargados. Creá el primero con el botón \"Nuevo Profesor\"."
                        : "Ningún profesor coincide con la búsqueda."}
                    </td>
                  </tr>
                )}
                {paginatedProfesores.map((profesor, i) => (
                  <tr key={profesor.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                    <td className="px-lg py-4">
                      <p className="font-label-bold text-on-surface">
                        {profesor.nombre} {profesor.apellido}
                      </p>
                      <p className="text-caption font-caption text-text-muted">Alta: {formatoFecha(profesor.fecha_alta)}</p>
                    </td>
                    <td className="px-lg py-4 text-body-sm text-on-surface-variant">{profesor.dni}</td>
                    <td className="px-lg py-4">
                      <div className="flex flex-wrap gap-1">
                        {profesor.disciplinas.length === 0 && <span className="text-body-sm text-text-muted">—</span>}
                        {profesor.disciplinas.map((d) => (
                          <span key={d.id} className="bg-info/10 text-info px-2 py-1 rounded-full text-caption font-label-bold">
                            {d.nombre}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-lg py-4 text-body-sm text-on-surface-variant">
                      {profesor.email && <p>{profesor.email}</p>}
                      {profesor.celular && <p>{profesor.celular}</p>}
                      {!profesor.email && !profesor.celular && "—"}
                    </td>
                    <td className="px-lg py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                          profesor.activo ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {profesor.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <a
                          href={`/profesores/${profesor.id}`}
                          className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </a>
                        <button
                          disabled={isPending}
                          onClick={() => setProfesorEditando(profesor)}
                          className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleToggleActivo(profesor)}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            profesor.activo ? "text-success hover:bg-success/10" : "text-on-surface-variant hover:bg-surface-container"
                          }`}
                          title={profesor.activo ? "Desactivar" : "Reactivar"}
                        >
                          <span className="material-symbols-outlined text-[20px]">{profesor.activo ? "toggle_on" : "toggle_off"}</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => setProfesorEliminando(profesor)}
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
              {filteredProfesores.length === 0
                ? "Sin resultados"
                : `Mostrando ${desde}-${hasta} de ${filteredProfesores.length} resultados`}
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
        <ProfesorFormModal mode="create" disciplinas={disciplinas} onClose={() => setModalCreateOpen(false)} />
      )}
      {profesorEditando && (
        <ProfesorFormModal
          mode="edit"
          disciplinas={disciplinas}
          profesor={profesorEditando}
          onClose={() => setProfesorEditando(null)}
        />
      )}
      {profesorEliminando && (
        <ConfirmModal
          title="Eliminar profesor"
          message={`¿Eliminar a "${profesorEliminando.nombre} ${profesorEliminando.apellido}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          pending={isPending}
          onConfirm={handleConfirmarEliminar}
          onCancel={() => setProfesorEliminando(null)}
        />
      )}
    </>
  );
}
