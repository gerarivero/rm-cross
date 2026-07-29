import { Sidebar } from "@/components/Sidebar";
import { getDisciplinas, getPlanes } from "./data";
import { PlanesView } from "./PlanesView";

export const dynamic = "force-dynamic";

export default async function PlanesPage() {
  const [planes, disciplinas] = await Promise.all([getPlanes(), getDisciplinas()]);

  return (
    <>
      <Sidebar activo="/planes" />
      <main className="md:ml-64 min-h-screen p-lg lg:p-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface mb-xs">Planes de Entrenamiento y Precios</h2>
            <p className="text-on-surface-variant font-body-sm text-body-sm">Catálogo de disciplinas, frecuencias y tarifas vigentes.</p>
          </div>
        </div>
        <PlanesView planes={planes} disciplinas={disciplinas} />
      </main>
    </>
  );
}
