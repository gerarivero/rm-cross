import { Sidebar } from "@/components/Sidebar";
import { getAlumnos, getPlanes, getPromocionesActivas, getTurnos } from "./data";
import { AlumnosView } from "./AlumnosView";

export const dynamic = "force-dynamic";

export default async function AlumnosPage({ searchParams }: { searchParams: { plan?: string } }) {
  const [alumnos, planes, turnos, promociones] = await Promise.all([
    getAlumnos(),
    getPlanes(),
    getTurnos(),
    getPromocionesActivas(),
  ]);

  return (
    <>
      <Sidebar activo="/alumnos" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <AlumnosView alumnos={alumnos} planes={planes} turnos={turnos} promociones={promociones} planFiltroInicial={searchParams.plan ?? null} />
      </main>
    </>
  );
}
