import { Sidebar } from "@/components/Sidebar";
import { getDisciplinas, getProfesores } from "./data";
import { ProfesoresView } from "./ProfesoresView";

export const dynamic = "force-dynamic";

export default async function ProfesoresPage() {
  const [profesores, disciplinas] = await Promise.all([getProfesores(), getDisciplinas()]);

  return (
    <>
      <Sidebar activo="/profesores" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <ProfesoresView profesores={profesores} disciplinas={disciplinas} />
      </main>
    </>
  );
}
