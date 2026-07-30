"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import type { CuotaConDetalle } from "@/lib/supabase/types";
import { registrarPago } from "./actions";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
}

function formatoFecha(valor: string) {
  return new Date(`${valor}T00:00:00`).toLocaleDateString("es-AR");
}

export function RegistrarPagoModal({ cuota, onClose }: { cuota: CuotaConDetalle; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registrarPago(cuota.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  const nombreAlumno =
    cuota.alumno.nombre || cuota.alumno.apellido ? `${cuota.alumno.nombre ?? ""} ${cuota.alumno.apellido ?? ""}`.trim() : `DNI ${cuota.alumno.dni}`;

  return (
    <Modal title="Registrar Pago" onClose={onClose}>
      {error && <div className="bg-error/10 border border-error/30 text-error rounded-lg p-sm text-body-sm mb-md">{error}</div>}

      <div className="bg-surface-container-low rounded-lg p-md border border-border mb-md space-y-1">
        <p className="font-label-bold text-on-surface">{nombreAlumno}</p>
        <p className="text-body-sm text-on-surface-variant">{cuota.plan.nombre}</p>
        <p className="text-caption font-caption text-text-muted">
          Período {formatoFecha(cuota.periodo_desde)} — {formatoFecha(cuota.periodo_hasta)} · Vence {formatoFecha(cuota.fecha_vencimiento)}
        </p>
        {cuota.estado_efectivo === "vencida" && (
          <p className="text-caption font-caption text-error">
            Vencida — recargo por mora incluido: {formatoMoneda(cuota.recargo_efectivo)}
          </p>
        )}
        {cuota.total_pagado > 0 && (
          <p className="text-caption font-caption text-on-surface-variant">Pagado hasta ahora: {formatoMoneda(cuota.total_pagado)}</p>
        )}
        <p className="text-body-sm font-label-bold text-on-surface">Saldo pendiente: {formatoMoneda(cuota.total_adeudado)}</p>
      </div>

      <form action={handleSubmit} className="space-y-md">
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Monto a pagar</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-sm pointer-events-none">$</span>
            <input
              name="monto"
              type="number"
              step="0.01"
              min={0.01}
              required
              defaultValue={cuota.total_adeudado}
              className="w-full border border-border rounded-lg pl-7 pr-3 py-2 outline-none focus:border-primary-container font-data-mono text-data-mono"
            />
          </div>
          <p className="text-caption font-caption text-text-muted mt-1">
            Podés registrar un pago parcial ingresando un monto menor al saldo.
          </p>
        </div>
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Medio de pago</label>
          <select name="medio" defaultValue="efectivo" className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container">
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="mercadopago">MercadoPago</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </div>
        <div>
          <label className="font-label-bold text-label-bold text-on-surface-variant">Referencia (opcional)</label>
          <input name="referencia" placeholder="Nº de operación / comprobante" className="mt-1 w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary-container" />
        </div>

        <div className="flex justify-end gap-sm">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="px-lg py-2 rounded-lg border border-border text-on-surface-variant font-label-bold text-label-bold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            disabled={isPending}
            type="submit"
            className="bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-label-bold text-label-bold disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Registrar Pago"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
