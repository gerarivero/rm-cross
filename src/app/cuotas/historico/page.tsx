import { Sidebar } from "@/components/Sidebar";
import { getPlanes } from "../../planes/data";
import { getCuotasHistorico } from "../data";
import { HistoricoView } from "./HistoricoView";

export const dynamic = "force-dynamic";

export default async function CuotasHistoricoPage() {
  const [cuotas, planes] = await Promise.all([getCuotasHistorico(), getPlanes()]);

  return (
    <>
      <Sidebar activo="/cuotas" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <HistoricoView cuotas={cuotas} planes={planes} />
      </main>
    </>
  );
}
