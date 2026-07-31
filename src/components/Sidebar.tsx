"use client";

import { useEffect, useState } from "react";
import { cerrarSesion } from "@/app/login/actions";
import { useMobileNav } from "./MobileNavProvider";
import { useUsuarioActual } from "./UsuarioActualProvider";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/alumnos", icon: "group", label: "Alumnos" },
  { href: "/profesores", icon: "badge", label: "Profesores" },
  { href: "/cuotas", icon: "payments", label: "Cuotas" },
  { href: "/planes", icon: "sell", label: "Planes" },
  { href: "/rutinas", icon: "fitness_center", label: "Rutinas" },
  { href: "/configuracion", icon: "settings", label: "Configuración" },
];

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Sidebar({ activo }: { activo: string }) {
  const [hovered, setHovered] = useState(false);
  const expanded = hovered;
  const { mobileNavOpen, closeMobileNav } = useMobileNav();
  const usuario = useUsuarioActual();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileNav();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMobileNav]);

  return (
    <>
      {/* Escritorio/tablet (md en adelante): colapsado por defecto, se expande con
          hover. overflow-y-auto en el nav para que en landscape con poca altura la
          lista de íconos scrollee en vez de cortarse. */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`hidden md:flex flex-col h-screen py-gutter bg-secondary fixed left-0 top-0 border-r border-outline-variant z-50 transition-[width] duration-200 ease-in-out overflow-hidden ${
          expanded ? "w-64 shadow-[4px_0_16px_rgba(0,0,0,0.15)]" : "w-20"
        }`}
      >
        <div className="mb-xl flex items-center justify-center px-2">
          <img
            src="/logo-rm.png"
            alt="RM Entrenamiento"
            className={`object-contain transition-all duration-200 ${expanded ? "w-16 h-16" : "w-10 h-10"}`}
          />
        </div>
        {expanded && (
          <p className="text-on-secondary opacity-70 font-label-bold text-label-bold text-center px-lg mb-md">Administración</p>
        )}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === activo;
            return (
              <a
                key={item.href}
                href={item.href}
                title={!expanded ? item.label : undefined}
                className={
                  isActive
                    ? `flex items-center text-primary-container font-bold border-l-4 border-primary-container py-3 bg-on-secondary-fixed-variant ${
                        expanded ? "pl-4" : "justify-center pl-0"
                      }`
                    : `flex items-center text-on-secondary opacity-80 hover:opacity-100 py-3 hover:bg-on-secondary-fixed-variant transition-colors ${
                        expanded ? "pl-5" : "justify-center pl-0"
                      }`
                }
              >
                <span className={`material-symbols-outlined ${expanded ? "mr-3" : ""}`}>{item.icon}</span>
                {expanded && <span className="font-label-bold text-label-bold whitespace-nowrap">{item.label}</span>}
              </a>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className={`pt-xl ${expanded ? "px-lg" : "px-2"}`}>
            {usuario && (
              <div className={`flex items-center gap-3 bg-on-secondary-fixed-variant rounded-xl border border-outline-variant/30 mb-2 ${expanded ? "p-3" : "p-2 justify-center"}`}>
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-bold text-label-bold shrink-0">
                  {iniciales(usuario.nombre)}
                </div>
                {expanded && (
                  <div className="overflow-hidden">
                    <p className="text-on-secondary font-label-bold text-label-bold truncate">{usuario.nombre}</p>
                    <p className="text-on-secondary opacity-60 text-caption font-caption truncate">
                      {usuario.es_admin ? "Admin" : "Profesor"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {usuario && (
            <div className="space-y-1">
              <a
                href="/cuenta"
                title={!expanded ? "Mi cuenta" : undefined}
                className={
                  activo === "/cuenta"
                    ? `flex items-center text-primary-container font-bold border-l-4 border-primary-container py-3 bg-on-secondary-fixed-variant ${
                        expanded ? "pl-4" : "justify-center pl-0"
                      }`
                    : `flex items-center text-on-secondary opacity-80 hover:opacity-100 py-3 hover:bg-on-secondary-fixed-variant transition-colors ${
                        expanded ? "pl-5" : "justify-center pl-0"
                      }`
                }
              >
                <span className={`material-symbols-outlined ${expanded ? "mr-3" : ""}`}>account_circle</span>
                {expanded && <span className="font-label-bold text-label-bold whitespace-nowrap">Mi cuenta</span>}
              </a>
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  title={!expanded ? "Cerrar sesión" : undefined}
                  className={`w-full flex items-center text-on-secondary opacity-80 hover:opacity-100 py-3 hover:bg-on-secondary-fixed-variant transition-colors ${
                    expanded ? "pl-5" : "justify-center pl-0"
                  }`}
                >
                  <span className={`material-symbols-outlined ${expanded ? "mr-3" : ""}`}>power_settings_new</span>
                  {expanded && <span className="font-label-bold text-label-bold whitespace-nowrap">Cerrar sesión</span>}
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile (debajo de md): drawer angosto, solo íconos (nunca se expande) —
          se abre desde el botón "menu" que cada header agrega en esos anchos. */}
      {mobileNavOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/40 z-[60]" onClick={closeMobileNav} />
          <aside className="md:hidden fixed left-0 top-0 h-screen w-20 bg-secondary z-[70] flex flex-col py-gutter overflow-y-auto shadow-[4px_0_16px_rgba(0,0,0,0.15)]">
            <div className="mb-xl flex items-center justify-center px-2">
              <img src="/logo-rm.png" alt="RM Entrenamiento" className="w-10 h-10 object-contain" />
            </div>
            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === activo;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileNav}
                    title={item.label}
                    className={
                      isActive
                        ? "flex items-center justify-center text-primary-container font-bold border-l-4 border-primary-container py-3 bg-on-secondary-fixed-variant"
                        : "flex items-center justify-center text-on-secondary opacity-80 hover:opacity-100 py-3 hover:bg-on-secondary-fixed-variant transition-colors"
                    }
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </a>
                );
              })}
            </nav>
            {usuario && (
              <div className="pt-md px-2 space-y-1 border-t border-outline-variant/30">
                <div className="flex justify-center">
                  <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-bold text-label-bold">
                    {iniciales(usuario.nombre)}
                  </div>
                </div>
                <a
                  href="/cuenta"
                  onClick={closeMobileNav}
                  title="Mi cuenta"
                  className={
                    activo === "/cuenta"
                      ? "flex items-center justify-center p-2 text-primary-container bg-on-secondary-fixed-variant rounded-lg"
                      : "flex items-center justify-center p-2 text-on-secondary opacity-70 hover:opacity-100 hover:bg-on-secondary-fixed-variant rounded-lg transition-colors"
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">account_circle</span>
                </a>
                <form action={cerrarSesion}>
                  <button
                    type="submit"
                    title="Cerrar sesión"
                    className="w-full flex items-center justify-center p-2 text-on-secondary opacity-70 hover:opacity-100 hover:bg-on-secondary-fixed-variant rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">power_settings_new</span>
                  </button>
                </form>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
