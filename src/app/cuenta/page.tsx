import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getUsuarioActual } from "@/lib/supabase/session";
import { CuentaView } from "./CuentaView";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  return (
    <>
      <Sidebar activo="/cuenta" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <CuentaView usuario={usuario} />
      </main>
    </>
  );
}
