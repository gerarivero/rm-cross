import { Sidebar } from "@/components/Sidebar";
import { getConfiguracionPagos, getTodasLasDisciplinas, getTodosLosTurnos } from "./data";
import { ConfiguracionView } from "./ConfiguracionView";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [configuracion, disciplinas, turnos] = await Promise.all([
    getConfiguracionPagos(),
    getTodasLasDisciplinas(),
    getTodosLosTurnos(),
  ]);

  return (
    <>
      <Sidebar activo="/configuracion" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <ConfiguracionView configuracion={configuracion} disciplinas={disciplinas} turnos={turnos} />
      </main>
    </>
  );
}
