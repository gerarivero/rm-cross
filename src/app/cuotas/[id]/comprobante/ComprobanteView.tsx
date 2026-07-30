"use client";

type PagoComprobante = {
  id: string;
  monto: number;
  fecha_pago: string;
  medio: string;
  referencia: string | null;
};

const MEDIO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "MercadoPago",
  tarjeta: "Tarjeta",
};

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
}

function formatoFecha(valor: string) {
  return new Date(valor).toLocaleDateString("es-AR");
}

export function ComprobanteView({
  numeroComprobante,
  alumno,
  planNombre,
  periodoDesde,
  periodoHasta,
  montoBase,
  recargoAplicado,
  pagos,
}: {
  numeroComprobante: number;
  alumno: { dni: string; nombre: string | null; apellido: string | null };
  planNombre: string;
  periodoDesde: string;
  periodoHasta: string;
  montoBase: number;
  recargoAplicado: number;
  pagos: PagoComprobante[];
}) {
  const nombreAlumno = alumno.nombre || alumno.apellido ? `${alumno.nombre ?? ""} ${alumno.apellido ?? ""}`.trim() : `DNI ${alumno.dni}`;
  const totalPagado = montoBase + recargoAplicado;
  const fechaComprobante = pagos.length > 0 ? pagos[pagos.length - 1].fecha_pago : new Date().toISOString();

  return (
    <div className="bg-surface min-h-screen p-md flex flex-col items-center print:p-0 print:bg-white">
      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none; }
        }
      `}</style>

      <div className="no-print w-full max-w-[500px] mb-md flex justify-between items-center">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1 px-lg py-2 bg-primary-container text-on-primary-container font-label-bold text-label-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px]">print</span>
          Imprimir Recibo
        </button>
      </div>

      <div className="bg-surface-white border border-border rounded-xl shadow-sm p-lg w-full max-w-[500px]">
        <div className="flex justify-between items-start mb-lg">
          <div className="flex items-center gap-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-rm.png" alt="Centro RM" className="w-14 h-14 object-contain" />
            <div>
              <h1 className="font-headline-md text-headline-md text-primary uppercase tracking-tight leading-none">Centro RM</h1>
              <p className="text-caption font-caption text-text-muted mt-1">Gestión Deportiva</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-label-bold text-label-bold text-secondary">Nº {String(numeroComprobante).padStart(6, "0")}</p>
            <p className="text-caption font-caption text-text-muted mt-1">Fecha: {formatoFecha(fechaComprobante)}</p>
          </div>
        </div>

        <div className="border-y border-border py-2 mb-lg">
          <h2 className="font-headline-md text-headline-md text-center text-secondary tracking-widest uppercase">Comprobante de Pago</h2>
        </div>

        <div className="grid grid-cols-2 gap-md mb-lg">
          <div>
            <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Alumno</p>
            <p className="font-label-bold text-body-sm text-on-surface mt-1">{nombreAlumno}</p>
          </div>
          <div>
            <p className="text-caption font-caption text-text-muted uppercase tracking-wider">DNI</p>
            <p className="font-data-mono text-data-mono text-on-surface mt-1">{alumno.dni}</p>
          </div>
          <div className="col-span-2">
            <p className="text-caption font-caption text-text-muted uppercase tracking-wider">Plan / Período</p>
            <p className="text-body-sm text-on-surface mt-1">
              {planNombre} · {formatoFecha(periodoDesde)} — {formatoFecha(periodoHasta)}
            </p>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-lg">
          <thead>
            <tr className="bg-secondary text-on-secondary">
              <th className="p-2 font-label-bold text-label-bold">Concepto</th>
              <th className="p-2 font-label-bold text-label-bold text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago) => (
              <tr key={pago.id} className="border-b border-border">
                <td className="p-2 py-3">
                  <span className="block font-label-bold text-on-surface">Pago — {MEDIO_LABEL[pago.medio] ?? pago.medio}</span>
                  <span className="text-caption text-text-muted">{formatoFecha(pago.fecha_pago)}</span>
                </td>
                <td className="p-2 py-3 text-right font-data-mono text-data-mono">{formatoMoneda(pago.monto)}</td>
              </tr>
            ))}
            {recargoAplicado > 0 && (
              <tr className="border-b border-border">
                <td className="p-2 py-3">
                  <span className="block font-label-bold text-on-surface">Intereses por pago vencido</span>
                  <span className="text-caption text-text-muted">Recargo por mora</span>
                </td>
                <td className="p-2 py-3 text-right font-data-mono text-data-mono">{formatoMoneda(recargoAplicado)}</td>
              </tr>
            )}
            <tr>
              <td className="p-2 pt-3 text-right font-label-bold text-secondary">Total Pagado</td>
              <td className="p-2 pt-3 text-right font-headline-md text-headline-md text-primary">{formatoMoneda(totalPagado)}</td>
            </tr>
          </tbody>
        </table>

        <div className="bg-surface-container-low rounded-lg p-md flex justify-between items-center">
          <span className="text-caption font-caption text-text-muted uppercase">Estado Final</span>
          <span className="inline-flex items-center px-3 py-1 bg-success/10 text-success rounded-full font-label-bold text-caption">
            <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
            PAGADO
          </span>
        </div>

        <div className="pt-md mt-lg border-t border-dashed border-border">
          <p className="font-label-bold text-label-bold text-secondary mb-1">¡Gracias por entrenar con nosotros!</p>
          <p className="text-caption font-caption text-text-muted">Centro RM</p>
        </div>
      </div>
    </div>
  );
}
