import { Sidebar } from "@/components/Sidebar";
import { getCuotas } from "./data";
import { CuotasView } from "./CuotasView";

export const dynamic = "force-dynamic";

export default async function CuotasPage() {
  const cuotas = await getCuotas();

  return (
    <>
      <Sidebar activo="/cuotas" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <CuotasView cuotas={cuotas} />
      </main>
    </>
  );
}
