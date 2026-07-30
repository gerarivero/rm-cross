import { getComprobanteCuota } from "../../data";
import { ComprobanteView } from "./ComprobanteView";

export const dynamic = "force-dynamic";

export default async function ComprobantePage({ params }: { params: { id: string } }) {
  const cuota = await getComprobanteCuota(params.id);

  if (!cuota) {
    return (
      <div className="p-lg text-center text-body-sm text-text-muted">No se encontró la cuota.</div>
    );
  }

  if (!cuota.numero_comprobante) {
    return (
      <div className="p-lg text-center text-body-sm text-text-muted">
        Esta cuota todavía no está pagada en su totalidad, todavía no tiene comprobante.
      </div>
    );
  }

  return (
    <ComprobanteView
      numeroComprobante={cuota.numero_comprobante}
      alumno={cuota.alumno}
      planNombre={cuota.plan.nombre}
      periodoDesde={cuota.periodo_desde}
      periodoHasta={cuota.periodo_hasta}
      montoBase={cuota.monto_base}
      recargoAplicado={cuota.recargo_aplicado}
      pagos={cuota.pagos}
    />
  );
}
