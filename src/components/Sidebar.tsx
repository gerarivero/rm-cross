"use client";

import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/alumnos", icon: "group", label: "Alumnos" },
  { href: "/profesores", icon: "badge", label: "Profesores" },
  { href: "/cuotas", icon: "payments", label: "Cuotas" },
  { href: "/planes", icon: "sell", label: "Planes" },
  { href: "/rutinas", icon: "fitness_center", label: "Rutinas" },
  { href: "/asistencia-alumnos", icon: "how_to_reg", label: "Asistencia Alumnos" },
  { href: "/asistencia-profesores", icon: "fingerprint", label: "Asistencia Profesores" },
  { href: "/estadisticas", icon: "leaderboard", label: "Estadísticas" },
  { href: "/configuracion", icon: "settings", label: "Configuración" },
];

// Rutas ya implementadas con datos reales. El resto navega pero muestra un
// aviso de "en construcción" hasta que se porten desde la maqueta de Stitch.
const RUTAS_IMPLEMENTADAS = new Set(["/planes", "/alumnos", "/cuotas"]);

export function Sidebar({ activo }: { activo: string }) {
  const [hovered, setHovered] = useState(false);
  const expanded = hovered;

  return (
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
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === activo;
          const implementada = RUTAS_IMPLEMENTADAS.has(item.href);
          return (
            <a
              key={item.href}
              href={implementada ? item.href : "#"}
              title={!expanded ? item.label : implementada ? undefined : "Todavía no portado desde la maqueta"}
              className={
                isActive
                  ? `flex items-center text-primary-container font-bold border-l-4 border-primary-container py-3 bg-on-secondary-fixed-variant ${
                      expanded ? "pl-4" : "justify-center pl-0"
                    }`
                  : `flex items-center text-on-secondary opacity-80 hover:opacity-100 py-3 hover:bg-on-secondary-fixed-variant transition-colors ${
                      expanded ? "pl-5" : "justify-center pl-0"
                    } ${implementada ? "" : "cursor-not-allowed opacity-40"}`
              }
            >
              <span className={`material-symbols-outlined ${expanded ? "mr-3" : ""}`}>{item.icon}</span>
              {expanded && <span className="font-label-bold text-label-bold whitespace-nowrap">{item.label}</span>}
            </a>
          );
        })}
      </nav>
      <div className={`pt-xl mt-auto ${expanded ? "px-lg" : "px-2"}`}>
        <div className={`flex items-center gap-3 bg-on-secondary-fixed-variant rounded-xl border border-outline-variant/30 ${expanded ? "p-3" : "p-2 justify-center"}`}>
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-bold text-label-bold shrink-0">
            RM
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-on-secondary font-label-bold text-label-bold truncate">Profesor Principal</p>
              <p className="text-on-secondary opacity-60 text-caption font-caption truncate">Admin</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
