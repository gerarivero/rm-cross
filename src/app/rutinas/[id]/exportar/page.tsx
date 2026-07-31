import { getAlumnoParaExportar, getProfesorExportador, getRutinaDetalle } from "./data";
import { ExportarRutinaView } from "./ExportarRutinaView";

export const dynamic = "force-dynamic";

export default async function ExportarRutinaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { alumno?: string };
}) {
  const [rutina, profesor, alumno] = await Promise.all([
    getRutinaDetalle(params.id),
    getProfesorExportador(),
    searchParams.alumno ? getAlumnoParaExportar(searchParams.alumno, params.id) : Promise.resolve(null),
  ]);

  return <ExportarRutinaView rutina={rutina} profesor={profesor} alumno={alumno} />;
}
