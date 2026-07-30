"use client";

import { Modal } from "@/components/Modal";
import type { CuotaConDetalle } from "@/lib/supabase/types";

const MEDIO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "MercadoPago",
  tarjeta: "Tarjeta",
};

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
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
}

function formatoFecha(valor: string) {
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

function formatoFechaHora(valor: string) {
  return new Date(valor).toLocaleString("es-AR");
}

export function DetallePagosModal({ cuota, onClose }: { cuota: CuotaConDetalle; onClose: () => void }) {
  const nombreAlumno =
    cuota.alumno.nombre || cuota.alumno.apellido ? `${cuota.alumno.nombre ?? ""} ${cuota.alumno.apellido ?? ""}`.trim() : `DNI ${cuota.alumno.dni}`;

  return (
    <Modal title="Detalle de la Cuota" onClose={onClose}>
      <div className="bg-surface-container-low rounded-lg p-md border border-border mb-md space-y-1">
        <p className="font-label-bold text-on-surface">{nombreAlumno}</p>
        <p className="text-body-sm text-on-surface-variant">{cuota.plan.nombre}</p>
        <p className="text-caption font-caption text-text-muted">
          Período {formatoFecha(cuota.periodo_desde)} — {formatoFecha(cuota.periodo_hasta)} · Vence {formatoFecha(cuota.fecha_vencimiento)}
        </p>
      </div>

      <h4 className="font-label-bold text-label-bold text-on-surface mb-2">Pagos registrados</h4>
      {cuota.pagos.length === 0 ? (
        <p className="text-body-sm text-text-muted mb-md">Todavía no se registró ningún pago sobre esta cuota.</p>
      ) : (
        <div className="overflow-x-auto mb-md border border-border rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary text-on-secondary">
                <th className="px-md py-2 font-label-bold text-label-bold">Fecha</th>
                <th className="px-md py-2 font-label-bold text-label-bold">Medio</th>
                <th className="px-md py-2 font-label-bold text-label-bold">Referencia</th>
                <th className="px-md py-2 font-label-bold text-label-bold text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cuota.pagos.map((pago, i) => (
                <tr key={pago.id} className={i % 2 === 1 ? "bg-surface-container-lowest" : ""}>
                  <td className="px-md py-2 text-body-sm text-on-surface-variant">{formatoFechaHora(pago.fecha_pago)}</td>
                  <td className="px-md py-2 text-body-sm text-on-surface">{MEDIO_LABEL[pago.medio] ?? pago.medio}</td>
                  <td className="px-md py-2 text-body-sm text-on-surface-variant">{pago.referencia ?? "—"}</td>
                  <td className="px-md py-2 font-data-mono text-data-mono text-right">{formatoMoneda(pago.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-1 border-t border-border pt-md">
        <div className="flex justify-between text-body-sm">
          <span className="text-on-surface-variant">Monto de la cuota</span>
          <span className="font-data-mono text-data-mono">{formatoMoneda(cuota.monto_base)}</span>
        </div>
        {cuota.recargo_efectivo > 0 && (
          <div className="flex justify-between text-body-sm">
            <span className="text-on-surface-variant">Recargo por mora</span>
            <span className="font-data-mono text-data-mono text-error">+{formatoMoneda(cuota.recargo_efectivo)}</span>
          </div>
        )}
        <div className="flex justify-between text-body-sm">
          <span className="text-on-surface-variant">Total pagado</span>
          <span className="font-data-mono text-data-mono">{formatoMoneda(cuota.total_pagado)}</span>
        </div>
        <div className="flex justify-between text-body-lg font-label-bold">
          <span className="text-on-surface">Saldo pendiente a la fecha</span>
          <span className="font-data-mono text-data-mono">{formatoMoneda(cuota.total_adeudado)}</span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-on-surface-variant text-body-sm">Estado</span>
          <span className={`px-3 py-1 rounded-full text-caption font-label-bold ${ESTADO_ESTILO[cuota.estado_efectivo]}`}>
            {ESTADO_LABEL[cuota.estado_efectivo]}
          </span>
        </div>
      </div>

      <div className="flex justify-end mt-lg">
        <button
          onClick={onClose}
          className="px-lg py-2 rounded-lg border border-border text-on-surface-variant font-label-bold text-label-bold"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
