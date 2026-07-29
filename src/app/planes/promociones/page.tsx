import { Sidebar } from "@/components/Sidebar";
import { getPlanes, getPromociones } from "./data";
import { PromocionesView } from "./PromocionesView";

export const dynamic = "force-dynamic";

export default async function PromocionesPage() {
  const [promociones, planes] = await Promise.all([getPromociones(), getPlanes()]);

  return (
    <>
      <Sidebar activo="/planes" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <PromocionesView promociones={promociones} planes={planes} />
      </main>
    </>
  );
}
