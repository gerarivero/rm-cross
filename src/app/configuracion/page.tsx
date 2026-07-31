import { Sidebar } from "@/components/Sidebar";
import { getAdministradores, getConfiguracionPagos, getTodasLasDisciplinas, getTodosLosTurnos } from "./data";
import { ConfiguracionView } from "./ConfiguracionView";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [configuracion, disciplinas, turnos, administradores] = await Promise.all([
    getConfiguracionPagos(),
    getTodasLasDisciplinas(),
    getTodosLosTurnos(),
    getAdministradores(),
  ]);

  return (
    <>
      <Sidebar activo="/configuracion" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <ConfiguracionView configuracion={configuracion} disciplinas={disciplinas} turnos={turnos} administradores={administradores} />
      </main>
    </>
  );
}
