"use client";

import { useState, useTransition } from "react";
import { useMobileNav } from "@/components/MobileNavProvider";
import type { ConfiguracionPagos, Disciplina, Turno } from "@/lib/supabase/types";
import { actualizarConfiguracionPagos } from "../cuotas/actions";
import { DisciplinaFormModal } from "./DisciplinaFormModal";
import { TurnoFormModal } from "./TurnoFormModal";
import { alternarActivoDisciplina, alternarActivoTurno } from "./actions";

function formatoHora(valor: string) {
  return valor.slice(0, 5);
}

export function ConfiguracionView({
  configuracion,
  disciplinas,
  turnos,
}: {
  configuracion: ConfiguracionPagos;
  disciplinas: Disciplina[];
  turnos: Turno[];
}) {
  const { toggleMobileNav } = useMobileNav();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [configError, setConfigError] = useState<string | null>(null);
  const [configPending, startConfigTransition] = useTransition();

  const [modalDisciplinaOpen, setModalDisciplinaOpen] = useState(false);
  const [disciplinaEditando, setDisciplinaEditando] = useState<Disciplina | null>(null);

  const [modalTurnoOpen, setModalTurnoOpen] = useState(false);
  const [turnoEditando, setTurnoEditando] = useState<Turno | null>(null);

  function handleGuardarConfiguracion(formData: FormData) {
    setConfigError(null);
    startConfigTransition(async () => {
      const result = await actualizarConfiguracionPagos(formData);
      if (!result.ok) setConfigError(result.error);
    });
  }

  function handleToggleDisciplina(disciplina: Disciplina) {
    setError(null);
    startTransition(async () => {
      const result = await alternarActivoDisciplina(disciplina.id, !disciplina.activo);
      if (!result.ok) setError(result.error);
    });
  }

  function handleToggleTurno(turno: Turno) {
    setError(null);
    startTransition(async () => {
      const result = await alternarActivoTurno(turno.id, !turno.activo);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-white border-b border-border shadow-sm flex justify-between items-center px-lg py-md w-full">
        <h2 className="font-headline-md text-headline-md text-primary">Configuración</h2>
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

        {/* Parámetros de Pagos */}
        <div className="bg-surface-white border border-border rounded-xl p-lg shadow-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">rule_settings</span>
            Parámetros de Pagos
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
              disabled={configPending}
              type="submit"
              className="bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-label-bold text-label-bold shadow-sm hover:opacity-90 transition-all h-fit disabled:opacity-50"
            >
              Guardar Configuración
            </button>
          </form>
        </div>

        {/* Disciplinas */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-border flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-background">Disciplinas</h3>
            <button
              onClick={() => setModalDisciplinaOpen(true)}
              className="flex items-center gap-xs px-lg py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity font-label-bold text-label-bold"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nueva Disciplina
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary text-on-secondary">
                  <th className="px-lg py-4 font-label-bold text-label-bold">Nombre</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Descripción</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {disciplinas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      Todavía no hay disciplinas cargadas.
                    </td>
                  </tr>
                )}
                {disciplinas.map((d, i) => (
                  <tr key={d.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                    <td className="px-lg py-4 font-label-bold text-on-surface">{d.nombre}</td>
                    <td className="px-lg py-4 text-body-sm text-on-surface-variant">{d.descripcion ?? "—"}</td>
                    <td className="px-lg py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                          d.activo ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {d.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <button
                          disabled={isPending}
                          onClick={() => setDisciplinaEditando(d)}
                          className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleToggleDisciplina(d)}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            d.activo ? "text-success hover:bg-success/10" : "text-on-surface-variant hover:bg-surface-container"
                          }`}
                          title={d.activo ? "Desactivar" : "Reactivar"}
                        >
                          <span className="material-symbols-outlined text-[20px]">{d.activo ? "toggle_on" : "toggle_off"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Turnos */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-lg py-md border-b border-border flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-background">Turnos</h3>
            <button
              onClick={() => setModalTurnoOpen(true)}
              className="flex items-center gap-xs px-lg py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity font-label-bold text-label-bold"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo Turno
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary text-on-secondary">
                  <th className="px-lg py-4 font-label-bold text-label-bold">Nombre</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Horario</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold">Estado</th>
                  <th className="px-lg py-4 font-label-bold text-label-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {turnos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-lg py-lg text-center text-body-sm text-text-muted">
                      Todavía no hay turnos cargados.
                    </td>
                  </tr>
                )}
                {turnos.map((t, i) => (
                  <tr key={t.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                    <td className="px-lg py-4 font-label-bold text-on-surface">{t.nombre}</td>
                    <td className="px-lg py-4 font-data-mono text-data-mono text-on-surface-variant">
                      {formatoHora(t.hora_inicio)} – {formatoHora(t.hora_fin)}
                    </td>
                    <td className="px-lg py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-caption font-label-bold ${
                          t.activo ? "bg-success/10 text-success" : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {t.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <button
                          disabled={isPending}
                          onClick={() => setTurnoEditando(t)}
                          className="p-2 text-info hover:bg-info/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleToggleTurno(t)}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            t.activo ? "text-success hover:bg-success/10" : "text-on-surface-variant hover:bg-surface-container"
                          }`}
                          title={t.activo ? "Desactivar" : "Reactivar"}
                        >
                          <span className="material-symbols-outlined text-[20px]">{t.activo ? "toggle_on" : "toggle_off"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalDisciplinaOpen && <DisciplinaFormModal mode="create" onClose={() => setModalDisciplinaOpen(false)} />}
      {disciplinaEditando && (
        <DisciplinaFormModal mode="edit" disciplina={disciplinaEditando} onClose={() => setDisciplinaEditando(null)} />
      )}
      {modalTurnoOpen && <TurnoFormModal mode="create" onClose={() => setModalTurnoOpen(false)} />}
      {turnoEditando && <TurnoFormModal mode="edit" turno={turnoEditando} onClose={() => setTurnoEditando(null)} />}
    </>
  );
}
