import { Sidebar } from "@/components/Sidebar";
import { getAlumnoDetalle, getCuotasDeAlumno, getPlanes, getPromocionesActivas, getTurnos } from "./data";
import { AlumnoDetalleView } from "./AlumnoDetalleView";

export const dynamic = "force-dynamic";

export default async function AlumnoDetallePage({ params }: { params: { id: string } }) {
  const [alumno, planes, turnos, promociones, cuotas] = await Promise.all([
    getAlumnoDetalle(params.id),
    getPlanes(),
    getTurnos(),
    getPromocionesActivas(),
    getCuotasDeAlumno(params.id),
  ]);

  return (
    <>
      <Sidebar activo="/alumnos" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <AlumnoDetalleView alumno={alumno} planes={planes} turnos={turnos} promociones={promociones} cuotas={cuotas} />
      </main>
    </>
  );
}
