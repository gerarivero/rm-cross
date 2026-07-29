import { Sidebar } from "@/components/Sidebar";
import { getDisciplinas, getPlanDetalle } from "./data";
import { PlanDetalleView } from "./PlanDetalleView";

export const dynamic = "force-dynamic";

export default async function PlanDetallePage({ params }: { params: { id: string } }) {
  const [plan, disciplinas] = await Promise.all([getPlanDetalle(params.id), getDisciplinas()]);

  return (
    <>
      <Sidebar activo="/planes" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <PlanDetalleView plan={plan} disciplinas={disciplinas} />
      </main>
    </>
  );
}
