"use client";

import { createContext, useContext, useState } from "react";

type MobileNavContextValue = {
  mobileNavOpen: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

// Estado del drawer de navegación mobile (Sidebar desaparece por debajo de md, ver
// src/components/Sidebar.tsx) — vive acá arriba de todo (src/app/layout.tsx) porque
// el botón que lo abre está en el header de cada página, no en el Sidebar mismo.
export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <MobileNavContext.Provider
      value={{
        mobileNavOpen,
        toggleMobileNav: () => setMobileNavOpen((open) => !open),
        closeMobileNav: () => setMobileNavOpen(false),
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav(): MobileNavContextValue {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav debe usarse dentro de MobileNavProvider");
  return ctx;
}
