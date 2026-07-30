import { Sidebar } from "@/components/Sidebar";
import { getAlumnosParaAsignar, getAsignaciones, getEjercicios, getRutinaDetalle } from "./data";
import { RutinaBuilderView } from "./RutinaBuilderView";

export const dynamic = "force-dynamic";

export default async function RutinaDetallePage({ params }: { params: { id: string } }) {
  const [rutina, asignaciones, alumnosParaAsignar, ejercicios] = await Promise.all([
    getRutinaDetalle(params.id),
    getAsignaciones(params.id),
    getAlumnosParaAsignar(),
    getEjercicios(),
  ]);

  return (
    <>
      <Sidebar activo="/rutinas" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <RutinaBuilderView rutina={rutina} asignaciones={asignaciones} alumnosParaAsignar={alumnosParaAsignar} ejercicios={ejercicios} />
      </main>
    </>
  );
}
