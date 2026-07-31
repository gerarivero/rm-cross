import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getUsuarioActual } from "@/lib/supabase/session";
import { getProfesores } from "../profesores/data";
import { CuentaView } from "./CuentaView";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const profesores = (await getProfesores()).filter((p) => p.activo);

  return (
    <>
      <Sidebar activo="/cuenta" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <CuentaView usuario={usuario} profesores={profesores} />
      </main>
    </>
  );
}
