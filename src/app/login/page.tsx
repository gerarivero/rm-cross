import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const usuario = await getUsuarioActual();
  if (usuario) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-lg">
      <div className="w-full max-w-sm bg-surface-white rounded-xl shadow-md p-xl">
        <div className="flex flex-col items-center mb-lg">
          <img src="/logo-rm.png" alt="RM Entrenamiento" className="w-20 h-20 object-contain mb-md" />
          <h1 className="font-headline-md text-headline-md text-primary">Centro RM</h1>
          <p className="text-body-sm font-body-sm text-text-muted mt-1">Ingresá con tu cuenta de administrador</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
