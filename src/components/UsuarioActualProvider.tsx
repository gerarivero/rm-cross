"use client";

import { createContext, useContext } from "react";
import type { UsuarioActual } from "@/lib/supabase/session";

const UsuarioActualContext = createContext<UsuarioActual | null>(null);

// Sembrado una sola vez desde src/app/layout.tsx (Server Component) con
// getUsuarioActual() — evita pasar el usuario como prop a los 12+ page.tsx que
// instancian <Sidebar />.
export function UsuarioActualProvider({ usuario, children }: { usuario: UsuarioActual | null; children: React.ReactNode }) {
  return <UsuarioActualContext.Provider value={usuario}>{children}</UsuarioActualContext.Provider>;
}

export function useUsuarioActual(): UsuarioActual | null {
  return useContext(UsuarioActualContext);
}
