"use client";

import { useState } from "react";
import { useMobileNav } from "@/components/MobileNavProvider";
import type { Disciplina, ProfesorConDisciplinas } from "@/lib/supabase/types";
import { ProfesorFormModal } from "../ProfesorFormModal";

function formatoFecha(valor: string | null) {
  if (!valor) return "—";
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

export function ProfesorDetalleView({ profesor, disciplinas }: { profesor: ProfesorConDisciplinas; disciplinas: Disciplina[] }) {
  const { toggleMobileNav } = useMobileNav();
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const nombreCompleto = `${profesor.nombre} ${profesor.apellido}`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex items-center justify-between gap-md px-lg py-md w-full">
        <div className="flex items-center gap-md">
          <a
            href="/profesores"
            className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
            title="Volver a Profesores"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </a>
          <h2 className="font-headline-md text-headline-md text-primary">{nombreCompleto}</h2>
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
            <h3 className="font-headline-md text-headline-md text-on-background">Información general</h3>
            <button
              onClick={() => setModalEditarOpen(true)}
              className="flex items-center gap-xs px-lg py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity font-label-bold text-label-bold"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">DNI</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{profesor.dni}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Estado</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-caption font-label-bold ${
                  profesor.activo ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {profesor.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Fecha de nacimiento</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{formatoFecha(profesor.fecha_nacimiento)}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Fecha de alta</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{formatoFecha(profesor.fecha_alta)}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Email</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{profesor.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Celular</p>
              <p className="font-label-bold text-label-bold text-on-surface mt-1">{profesor.celular ?? "—"}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Disciplinas que dicta</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {profesor.disciplinas.length === 0 && <p className="font-label-bold text-label-bold text-on-surface">—</p>}
                {profesor.disciplinas.map((d) => (
                  <span key={d.id} className="bg-info/10 text-info px-2 py-1 rounded-full text-caption font-label-bold">
                    {d.nombre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalEditarOpen && (
        <ProfesorFormModal mode="edit" disciplinas={disciplinas} profesor={profesor} onClose={() => setModalEditarOpen(false)} />
      )}
    </>
  );
}
