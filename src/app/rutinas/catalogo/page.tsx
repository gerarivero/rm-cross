import { Sidebar } from "@/components/Sidebar";
import { getEjercicios, getMusculos } from "./data";
import { CatalogoView } from "./CatalogoView";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const [musculos, ejercicios] = await Promise.all([getMusculos(), getEjercicios()]);

  return (
    <>
      <Sidebar activo="/rutinas" />
      <main className="md:ml-20 min-h-screen flex flex-col">
        <CatalogoView musculos={musculos} ejercicios={ejercicios} />
      </main>
    </>
  );
}
