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

5. Abrí http://localhost:3000 — redirige a `/login` y luego a `/dashboard`.

## Estado del proyecto

- **Implementado:**
  - **Planes**: alta, catálogo con precio vigente, promociones, desactivar/reactivar,
    eliminar con protección si tiene alumnos inscriptos.
  - **Alumnos**: alta, detalle, re-inscripción, fotos de progreso, eliminar con
    protección/cascada.
  - **Cuotas**: alta automática al inscribir/renovar, pagos parciales con
    comprobante, gracia y recargo por mora, panel con resumen e histórico.
  - **Rutinas**: plantillas de 4 semanas, asignación a alumnos (genérica o
    personalizada), export a PDF, alerta de revisión.
  - **Profesores**: roster, disciplinas que dicta.
  - **Configuración**: parámetros de pagos, Disciplinas/Turnos.
  - **Autenticación**: login real con Supabase Auth, logout, gestión de
    administradores (alta, eliminar, restablecer contraseña, editar email),
    vinculación admin ↔ profesor del roster.
  - **Cuenta**: página Mi Cuenta.
- **Pendiente (maquetado en Stitch, sin código todavía):** Asistencia (alumnos y
  profesores), Reserva de clases, Notificaciones, Reportes y estadísticas, y un
  portal/vista propia para que el alumno se loguee y vea su información (mi
  panel, mi rutina). El resto de las pantallas de referencia viven en
  `stitch_rm_design_system/` como HTML estático.
- **Modelo de datos completo:** `docs/modelo_datos.md`.
- **Despliegue a producción:** `docs/deploy.md` (DigitalOcean + GitHub Actions).

## Por qué Next.js + Supabase

Ver la conversación de arranque del proyecto: Next.js permite reusar directamente
los componentes/tokens de Tailwind que salieron de Stitch, y Supabase da Postgres +
Auth + Storage sin tener que levantar esa infraestructura a mano — encaja bien para
un gimnasio único (no multi-tenant).

## Estructura

```
src/app/planes/       módulo de Planes (page, actions, data, UI)
src/app/alumnos/      módulo de Alumnos
src/app/cuotas/       módulo de Cuotas
src/app/rutinas/      módulo de Rutinas
src/app/profesores/   módulo de Profesores
src/app/configuracion/ Configuración (pagos, disciplinas/turnos, admins)
src/app/cuenta/        página Mi Cuenta
src/app/login/         login con Supabase Auth
src/components/       componentes compartidos (Sidebar, etc.)
src/lib/supabase/     cliente de Supabase y tipos
supabase/migrations/  schema SQL, en orden de aplicación
docs/modelo_datos.md  modelo de datos completo del sistema
```
