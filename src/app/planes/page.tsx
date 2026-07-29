import { Sidebar } from "@/components/Sidebar";
import { getDisciplinas, getPlanes } from "./data";
import { PlanesView } from "./PlanesView";

export const dynamic = "force-dynamic";

export default async function PlanesPage() {
  const [planes, disciplinas] = await Promise.all([getPlanes(), getDisciplinas()]);

  return (
    <>
      <Sidebar activo="/planes" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <PlanesView planes={planes} disciplinas={disciplinas} />
      </main>
    </>
  );
}
