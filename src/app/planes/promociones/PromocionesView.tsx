"use client";

import { useState, useTransition } from "react";
import { useMobileNav } from "@/components/MobileNavProvider";
import type { Plan, PromocionConPlanes } from "@/lib/supabase/types";
import { PromocionFormModal } from "./PromocionFormModal";
import { desactivarPromocion, reactivarPromocion } from "./actions";

function formatoFecha(valor: string | null) {
  if (!valor) return null;
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

export function PromocionesView({ promociones, planes }: { promociones: PromocionConPlanes[]; planes: Plan[] }) {
  const { toggleMobileNav } = useMobileNav();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [promocionEditando, setPromocionEditando] = useState<PromocionConPlanes | null>(null);

  function handleToggleActiva(promocion: PromocionConPlanes) {
    setError(null);
    startTransition(async () => {
      const result = promocion.activa ? await desactivarPromocion(promocion.id) : await reactivarPromocion(promocion.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex items-center justify-between gap-md px-lg py-md w-full">
        <div className="flex items-center gap-md">
          <a href="/planes" className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors" title="Volver a Planes">
            <span className="material-symbols-outlined">arrow_back</span>
          </a>
          <h2 className="font-headline-md text-headline-md text-primary">Promociones</h2>
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
        {error && <div className="bg-error/10 border border-error/30 text-error rounded-xl p-md text-body-sm">{error}</div>}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="space-y-1">
            <h3 className="font-headline-md text-headline-md text-on-background">Catálogo de Promociones</h3>
            <p className="text-body-sm font-body-sm text-text-muted">Precios especiales aplicables al asignar un plan a un alumno.</p>
          </div>
          <button
            onClick={() => setModalCreateOpen(true)}
            className="flex items-center gap-xs px-lg py-2.5 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity shadow-md font-label-bold text-label-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nueva Promoción
          </button>
        </div>

        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary text-on-secondary">
                  <th className="px-lg py-4 font-label-bold text-label-bold">Nombre</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Vigencia</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Planes aplicables</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {promociones.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      {'Todavía no hay promociones cargadas. Creá la primera con el botón "Nueva Promoción".'}
                    </td>
                  </tr>
                )}
                {promociones.map((promo, i) => {
                  const desde = formatoFecha(promo.fecha_inicio);
                  const hasta = formatoFecha(promo.fecha_fin);
                  return (
                    <tr key={promo.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                      <td className="px-lg py-4">
                        <p className="font-label-bold text-on-surface">{promo.nombre}</p>
                        {promo.descripcion && <p className="text-caption font-caption text-text-muted">{promo.descripcion}</p>}
                      </td>
                      <td className="px-lg py-4 text-body-sm text-on-surface-variant">
                        {desde || hasta ? `${desde ?? "…"} — ${hasta ?? "sin límite"}` : "Sin límite"}
                      </td>
                      <td className="px-lg py-4">
                        <div className="flex flex-wrap gap-1">
                          {promo.planes.length === 0 ? (
                            <span className="text-caption font-caption text-text-muted">Ninguno</span>
                          ) : (
                            promo.planes.map((p) => (
                              <span key={p.id} className="bg-info/10 text-info px-2 py-1 rounded-full text-caption font-label-bold">
                                {p.nombre}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-lg py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                            promo.activa ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {promo.activa ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-lg py-4 text-right">
                        <div className="flex items-center justify-end gap-sm">
                          <button
                            disabled={isPending}
                            onClick={() => setPromocionEditando(promo)}
                            className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            disabled={isPending}
                            onClick={() => handleToggleActiva(promo)}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              promo.activa ? "text-success hover:bg-success/10" : "text-on-surface-variant hover:bg-surface-container"
                            }`}
                            title={promo.activa ? "Desactivar" : "Reactivar"}
                          >
                            <span className="material-symbols-outlined text-[20px]">{promo.activa ? "toggle_on" : "toggle_off"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalCreateOpen && <PromocionFormModal mode="create" planes={planes} onClose={() => setModalCreateOpen(false)} />}
      {promocionEditando && (
        <PromocionFormModal mode="edit" planes={planes} promocion={promocionEditando} onClose={() => setPromocionEditando(null)} />
      )}
    </>
  );
}
