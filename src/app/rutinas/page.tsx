import { Sidebar } from "@/components/Sidebar";
import { getRutinas } from "./data";
import { RutinasView } from "./RutinasView";

export const dynamic = "force-dynamic";

export default async function RutinasPage() {
  const rutinas = await getRutinas();

  return (
    <>
      <Sidebar activo="/rutinas" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <RutinasView rutinas={rutinas} />
      </main>
    </>
  );
}
