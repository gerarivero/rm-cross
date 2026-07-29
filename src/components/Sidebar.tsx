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
const RUTAS_IMPLEMENTADAS = new Set(["/planes"]);

export function Sidebar({ activo }: { activo: string }) {
  return (
    <aside className="hidden md:flex flex-col h-screen py-gutter bg-secondary w-64 fixed left-0 top-0 shadow-md border-r border-outline-variant z-50">
      <div className="px-lg mb-xl">
        <div className="flex justify-center items-center w-full mb-md">
          <span className="font-display-lg-mobile text-display-lg-mobile font-bold text-on-secondary">Centro RM</span>
        </div>
        <p className="text-on-secondary opacity-70 font-label-bold text-label-bold text-center">Administración</p>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === activo;
          const implementada = RUTAS_IMPLEMENTADAS.has(item.href);
          return (
            <a
              key={item.href}
              href={implementada ? item.href : "#"}
              className={
                isActive
                  ? "flex items-center text-primary-container font-bold border-l-4 border-primary-container pl-4 py-3 bg-on-secondary-fixed-variant"
                  : `flex items-center text-on-secondary opacity-80 hover:opacity-100 pl-5 py-3 hover:bg-on-secondary-fixed-variant transition-colors ${
                      implementada ? "" : "cursor-not-allowed opacity-40"
                    }`
              }
              title={implementada ? undefined : "Todavía no portado desde la maqueta"}
            >
              <span className="material-symbols-outlined mr-3">{item.icon}</span>
              <span className="font-label-bold text-label-bold">{item.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="px-lg pt-xl mt-auto">
        <div className="flex items-center gap-3 bg-on-secondary-fixed-variant p-3 rounded-xl border border-outline-variant/30">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-bold text-label-bold">
            RM
          </div>
          <div className="overflow-hidden">
            <p className="text-on-secondary font-label-bold text-label-bold truncate">Profesor Principal</p>
            <p className="text-on-secondary opacity-60 text-caption font-caption truncate">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
