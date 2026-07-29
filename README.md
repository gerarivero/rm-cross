# Centro RM — Sistema de gestión

## Puesta en marcha

1. Creá un proyecto en [supabase.com](https://supabase.com) (plan free alcanza para arrancar).
2. En el SQL Editor de Supabase, ejecutá en orden los archivos de `supabase/migrations/`.
3. Copiá `.env.example` a `.env.local` y completá `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
   (Project Settings → API en el dashboard de Supabase).
4. Instalá dependencias y corré el servidor de desarrollo:

```bash
npm install
npm run dev
```

5. Abrí http://localhost:3000 — redirige a `/planes`, el primer módulo implementado.

## Estado del proyecto

- **Implementado:** módulo de Planes de Entrenamiento (alta, catálogo con precio
  vigente, desactivar/reactivar, eliminar con protección si tiene alumnos
  inscriptos).
- **Maquetado (Stitch, sin código todavía):** el resto de las pantallas viven en
  `stitch_rm_design_system/` como HTML estático de referencia visual.
- **Modelo de datos completo:** `docs/modelo_datos.md`.

## Por qué Next.js + Supabase

Ver la conversación de arranque del proyecto: Next.js permite reusar directamente
los componentes/tokens de Tailwind que salieron de Stitch, y Supabase da Postgres +
Auth + Storage sin tener que levantar esa infraestructura a mano — encaja bien para
un gimnasio único (no multi-tenant).

## Estructura

```
src/app/planes/       módulo de Planes (page, actions, data, UI)
src/components/       componentes compartidos (Sidebar, etc.)
src/lib/supabase/     cliente de Supabase y tipos
supabase/migrations/  schema SQL, en orden de aplicación
docs/modelo_datos.md  modelo de datos completo del sistema
```
