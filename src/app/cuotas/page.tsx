import { Sidebar } from "@/components/Sidebar";
import { getConfiguracionPagos, getCuotas } from "./data";
import { CuotasView } from "./CuotasView";

export const dynamic = "force-dynamic";

export default async function CuotasPage() {
  const [cuotas, configuracion] = await Promise.all([getCuotas(), getConfiguracionPagos()]);

  return (
    <>
      <Sidebar activo="/cuotas" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <CuotasView cuotas={cuotas} configuracion={configuracion} />
      </main>
    </>
  );
}
