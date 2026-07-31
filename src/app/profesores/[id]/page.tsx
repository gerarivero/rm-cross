import { Sidebar } from "@/components/Sidebar";
import { getDisciplinas, getProfesorDetalle } from "./data";
import { ProfesorDetalleView } from "./ProfesorDetalleView";

export const dynamic = "force-dynamic";

export default async function ProfesorDetallePage({ params }: { params: { id: string } }) {
  const [profesor, disciplinas] = await Promise.all([getProfesorDetalle(params.id), getDisciplinas()]);

  return (
    <>
      <Sidebar activo="/profesores" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <ProfesorDetalleView profesor={profesor} disciplinas={disciplinas} />
      </main>
    </>
  );
}
