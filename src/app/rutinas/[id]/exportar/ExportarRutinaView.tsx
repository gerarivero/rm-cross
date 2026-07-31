"use client";

import type { RutinaDetalle, TipoActividad } from "@/lib/supabase/types";

const TIPO_ACTIVIDAD_LABEL: Record<TipoActividad, string> = {
  calentamiento: "Calentamiento",
  musculacion: "Musculación",
  recuperacion: "Recuperación",
};

const INTENSIDAD_LABEL: Record<string, string> = { baja: "Baja", media: "Media", alta: "Alta" };

function formatoFecha(valor: string) {
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

export function ExportarRutinaView({
  rutina,
  profesor,
  alumno,
}: {
  rutina: RutinaDetalle;
  profesor: { nombre: string; email: string } | null;
  alumno: { nombre: string | null; apellido: string | null; dni: string; fecha_inicio: string } | null;
}) {
  const nombreAlumno = alumno ? (alumno.nombre || alumno.apellido ? `${alumno.nombre ?? ""} ${alumno.apellido ?? ""}`.trim() : `DNI ${alumno.dni}`) : null;

  return (
    <div className="bg-surface min-h-screen p-md flex flex-col items-center print:p-0 print:bg-white">
      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none; }
          .semana-bloque { break-after: page; }
          .semana-bloque:last-child { break-after: auto; }
        }
      `}</style>

      <div className="no-print w-full max-w-[800px] mb-md flex justify-between items-center">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1 px-lg py-2 bg-primary-container text-on-primary-container font-label-bold text-label-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px]">print</span>
          Imprimir / Guardar PDF
        </button>
      </div>

      <div className="w-full max-w-[800px] space-y-lg">
        {/* Cabecera */}
        <div className="bg-surface-white border border-border rounded-xl shadow-sm p-lg">
          <div className="flex justify-between items-start mb-md">
            <div className="flex items-center gap-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-rm.png" alt="Centro RM" className="w-14 h-14 object-contain" />
              <div>
                <h1 className="font-headline-md text-headline-md text-primary uppercase tracking-tight leading-none">Centro RM</h1>
                <p className="text-caption font-caption text-text-muted mt-1">Gestión Deportiva</p>
              </div>
            </div>
            {profesor && (
              <div className="text-right">
                <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Profesor</p>
                <p className="font-label-bold text-label-bold text-on-surface mt-1">{profesor.nombre}</p>
              </div>
            )}
          </div>

          <div className="border-y border-border py-2 mb-md">
            <h2 className="font-headline-md text-headline-md text-center text-secondary tracking-widest uppercase">{rutina.nombre}</h2>
          </div>

          {rutina.descripcion && <p className="text-body-sm text-on-surface-variant mb-md">{rutina.descripcion}</p>}

          {alumno ? (
            <div className="grid grid-cols-3 gap-md bg-surface-container-low rounded-lg p-md">
              <div>
                <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Alumno</p>
                <p className="font-label-bold text-label-bold text-on-surface mt-1">{nombreAlumno}</p>
              </div>
              <div>
                <p className="text-caption font-caption text-text-muted uppercase tracking-wider">DNI</p>
                <p className="font-data-mono text-data-mono text-on-surface mt-1">{alumno.dni}</p>
              </div>
              {alumno.fecha_inicio && (
                <div>
                  <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Inicio</p>
                  <p className="font-label-bold text-label-bold text-on-surface mt-1">{formatoFecha(alumno.fecha_inicio)}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-caption font-caption text-text-muted">Plantilla genérica — sin datos de alumno.</p>
          )}
        </div>

        {/* Semanas */}
        {rutina.semanas.map((semana) => (
          <div key={semana.id} className="semana-bloque bg-surface-white border border-border rounded-xl shadow-sm p-lg">
            <h3 className="font-headline-md text-headline-md text-primary mb-md">Semana {semana.numero_semana}</h3>

            {semana.dias.length === 0 ? (
              <p className="text-body-sm text-text-muted">Sin días cargados.</p>
            ) : (
              <div className="space-y-md">
                {semana.dias.map((dia) => (
                  <div key={dia.id} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-secondary text-on-secondary px-md py-2">
                      <p className="font-label-bold text-label-bold">Día {dia.numero_dia}</p>
                    </div>
                    <div className="p-md space-y-md">
                      {dia.actividades.length === 0 && <p className="text-caption font-caption text-text-muted">Sin actividades.</p>}
                      {dia.actividades.map((actividad) => (
                        <div key={actividad.id}>
                          <p className="font-label-bold text-body-sm text-secondary uppercase tracking-wide mb-1">
                            {TIPO_ACTIVIDAD_LABEL[actividad.tipo]}
                          </p>
                          {actividad.ejercicios.length === 0 ? (
                            <p className="text-caption font-caption text-text-muted">Sin ejercicios.</p>
                          ) : (
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="py-1 pr-2 font-label-bold text-caption text-on-surface-variant">Ejercicio</th>
                                  <th className="py-1 pr-2 font-label-bold text-caption text-on-surface-variant">Músculo</th>
                                  <th className="py-1 pr-2 font-label-bold text-caption text-on-surface-variant">Intensidad</th>
                                  <th className="py-1 pr-2 font-label-bold text-caption text-on-surface-variant">Series</th>
                                  <th className="py-1 pr-2 font-label-bold text-caption text-on-surface-variant">Reps</th>
                                  <th className="py-1 pr-2 font-label-bold text-caption text-on-surface-variant">Duración</th>
                                  <th className="py-1 font-label-bold text-caption text-on-surface-variant">Notas</th>
                                </tr>
                              </thead>
                              <tbody>
                                {actividad.ejercicios.map((ej) => (
                                  <tr key={ej.id} className="border-b border-border last:border-0">
                                    <td className="py-1.5 pr-2 text-body-sm text-on-surface font-label-bold">{ej.ejercicio.nombre}</td>
                                    <td className="py-1.5 pr-2 text-caption text-on-surface-variant">{ej.ejercicio.musculo.nombre}</td>
                                    <td className="py-1.5 pr-2 text-caption text-on-surface-variant">
                                      {ej.intensidad ? INTENSIDAD_LABEL[ej.intensidad] : "—"}
                                    </td>
                                    <td className="py-1.5 pr-2 text-caption font-data-mono text-data-mono">{ej.series ?? "—"}</td>
                                    <td className="py-1.5 pr-2 text-caption font-data-mono text-data-mono">{ej.repeticiones ?? "—"}</td>
                                    <td className="py-1.5 pr-2 text-caption font-data-mono text-data-mono">
                                      {ej.duracion_minutos ? `${ej.duracion_minutos} min` : "—"}
                                    </td>
                                    <td className="py-1.5 text-caption text-on-surface-variant">{ej.notas ?? "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="h-10 no-print" />
    </div>
  );
}
