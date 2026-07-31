import { Sidebar } from "@/components/Sidebar";
import { getEventosDashboard, getResumenAlumnos, getResumenCuotasMes } from "./data";
import { DashboardView } from "./DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [resumenAlumnos, resumenCuotas, eventos] = await Promise.all([
    getResumenAlumnos(),
    getResumenCuotasMes(),
    getEventosDashboard(),
  ]);

  return (
    <>
      <Sidebar activo="/dashboard" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <DashboardView resumenAlumnos={resumenAlumnos} resumenCuotas={resumenCuotas} eventos={eventos} />
      </main>
    </>
  );
}
