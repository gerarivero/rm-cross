"use client";

import { useState } from "react";

const inputClass = "mt-1 w-full border border-border rounded-lg px-3 py-2 pr-10 outline-none focus:border-primary-container";

// Mismo <input> de contraseña que ya usa toda la app, con un ícono de ojo para
// alternar texto plano/oculto. Reemplaza <input type="password" .../> en los
// formularios de login, cambiar/restablecer contraseña y alta de administrador.
export function PasswordInput({
  name,
  required,
  minLength,
  autoComplete,
  defaultValue,
  className,
}: {
  name: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  defaultValue?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className={className ?? inputClass}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">{visible ? "visibility_off" : "visibility"}</span>
      </button>
    </div>
  );
}
