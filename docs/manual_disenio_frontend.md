# Manual de Diseño — Frontend Centro RM

Este documento codifica el estilo y los patrones ya usados en el módulo de **Planes**
(`src/app/planes/`), que es la referencia para todo módulo nuevo (Alumnos, Profesores,
Cuotas, etc.). No inventa reglas: todo acá ya existe en código. Si algo en este
documento y el código real difieren, **el código manda** — actualizá este archivo.

---

## 1. Principios generales

1. **Reusar antes que crear.** Antes de escribir un componente nuevo, revisar
   `src/components/` (`Modal`, `ConfirmModal`) y los patrones de `src/app/planes/`.
   La mayoría de las pantallas de gestión (listado + alta/edición + baja) son
   variaciones del mismo esqueleto.
2. **Server/Client bien separados.** Cada módulo tiene:
   - `page.tsx` — Server Component. Solo hace `await` de los datos y renderiza
     `<Sidebar>` + el componente `View` de cliente.
   - `data.ts` — funciones `async` de solo lectura contra Supabase (`getX`, `getXDetalle`).
   - `actions.ts` — Server Actions (`"use server"`) que escriben datos y devuelven
     `ActionResult` (`{ ok: true } | { ok: false; error: string }`).
   - `XxxView.tsx` — Client Component (`"use client"`) con el layout visual completo
     (header, toolbar, tabla, modales) y el estado de interacción (búsqueda,
     paginación, qué modal está abierto).
   - `XxxFormModal.tsx` — formulario de alta/edición dentro de `Modal`, con un prop
     `mode: "create" | "edit"` para reusar el mismo componente en ambos casos.
3. **Nada de `confirm()`/`alert()` nativos del navegador.** Toda confirmación
   destructiva usa `ConfirmModal`.

---

## 2. Tokens de color

Definidos en `tailwind.config.ts` (tomados 1:1 de
`stitch_rm_design_system/atleta_pro_management/DESIGN.md`, la maqueta de Stitch). Usar
siempre estas clases (`bg-primary`, `text-error`, etc.), nunca colores hardcodeados.

| Token | Valor | Uso |
|---|---|---|
| `primary` / `primary-container` | `#8a5100` / `#e8973a` | Naranja de marca. CTAs principales, títulos de sección, active state del sidebar. `primary-container` es el naranja "vivo" para fondos de botón; `primary` para texto/ícono sobre fondo claro. |
| `secondary` | `#4f6264` | Slate. Fondo del Sidebar y de los headers de tabla (`bg-secondary text-on-secondary`). |
| `success` | `#4CAF50` | Estados positivos: "Activo", "Pagada", inscripción "activa". |
| `warning` | `#FFC107` | Estados de alerta suave: "Adeudada", inscripción "pausada". |
| `error` | `#F44336` | Estados críticos, botones destructivos, mensajes de error. |
| `info` | `#2196F3` | Badges informativos neutros (ej. frecuencia "3x/semana"). |
| `surface-white` | `#FFFFFF` | Fondo de cards y tablas. |
| `surface-container-low` / `surface-container-lowest` | grises muy claros | Fondos de header de card, zebra-striping de filas pares. |
| `border` | `#D0D0D0` | Bordes de inputs, cards y separadores de tabla. |
| `text-muted` | `#757575` | Texto secundario / subtítulos. |
| `on-surface` / `on-surface-variant` | grafito oscuro | Texto principal / secundario sobre fondo blanco. |
| `on-primary-container` / `on-secondary` / `on-error` | blanco | Texto sobre fondos de color saturado. |

**Regla semántica:** success/warning/error/info se usan **solo** para estado de datos
(badges, mensajes), nunca para decoración. `primary` se reserva para acciones, no para
texto informativo.

---

## 3. Tipografía

Familia **Hanken Grotesk** para todo el texto de UI, **JetBrains Mono** solo para datos
numéricos (montos, IDs). Clases ya configuradas en `tailwind.config.ts`:

| Clase (`font-*` + `text-*`) | Tamaño/peso | Uso |
|---|---|---|
| `display-lg` | 32px bold | Títulos grandes de página (poco usado dentro de cards). |
| `display-lg-mobile` | 24px bold | Logo/marca en headers móviles. |
| `headline-md` | 20px semibold | Títulos de página y de card (`<h2>`/`<h3>` de cada sección). |
| `body-lg` | 16px regular | Texto de body por defecto (heredado del `<body>`). |
| `body-sm` | 14px regular | Texto secundario, celdas de tabla, subtítulos. |
| `label-bold` | 14px semibold | Labels de formulario, texto de botones, nombres en tabla. |
| `caption` | 12px regular | Badges, metadata pequeña (ej. "ID: #123"). |
| `data-mono` | 13px mono | Montos (`formatoMoneda`), fechas en tablas, IDs. |

Patrón de uso: siempre `font-X text-X` juntos (ej. `font-headline-md text-headline-md`),
porque `font-*` trae la familia+peso y `text-*` trae tamaño+line-height desde la
config de Tailwind.

---

## 4. Espaciado

Escala de 8px, también en `tailwind.config.ts`: `xs` (4px), `sm` (8px), `md` (16px),
`lg` (24px), `xl` (32px), `gutter` (24px, para gaps entre cards). Usar estas clases
(`p-lg`, `gap-md`, `space-y-gutter`) en vez de valores arbitrarios de Tailwind.

---

## 5. Estructura estándar de página

Ejemplo de referencia: `src/app/planes/PlanesView.tsx`.

```
<Sidebar activo="/ruta-del-modulo" />          ← src/components/Sidebar.tsx
<main className="md:ml-20 min-h-screen flex flex-col">
  <XxxView ...datos />
</main>
```

Dentro de `XxxView`:

1. **Header sticky** (`sticky top-0 z-40 bg-surface-white border-b border-border
   shadow-sm`): título de la página a la izquierda (`headline-md text-primary`),
   buscador global a la derecha si el módulo tiene tabla filtrable (mismo input con
   ícono `search` que en Planes), botón `menu` de navegación mobile al final (ver
   "Responsive / mobile" más abajo). No hay ningún ícono de usuario/cuenta en el
   header — las opciones de usuario van a vivir en `/configuracion`.
2. **Toolbar** (debajo del header, dentro de un contenedor `p-lg space-y-gutter`):
   subtítulo con contador ("Mostrando X de Y...") a la izquierda, botón primario de
   alta a la derecha.
3. **Card(s) de contenido**: `bg-surface-white border border-border rounded-xl
   shadow-sm` (o `shadow-[0_2px_8px_rgba(0,0,0,0.08)]` para cards con tabla). Cada
   card tiene su propio header interno (`px-lg py-md border-b border-border`) con el
   título de esa sección.

**Nota sobre el Sidebar:** es `w-20` colapsado por defecto y se expande a `w-64` con
hover, superponiéndose al contenido (`position: fixed`, no empuja el layout) — por eso
el margen del `<main>` siempre es `md:ml-20` (el ancho colapsado), nunca `md:ml-64`.

### Responsive / mobile

`Sidebar` (`src/components/Sidebar.tsx`) es `hidden md:flex` — por debajo de `md`
(768px, breakpoints default de Tailwind, sin overrides en `tailwind.config.ts`)
desaparece por completo, no solo visualmente. Para que el usuario pueda seguir
navegando en ese rango existe:

- **`MobileNavProvider`** (`src/components/MobileNavProvider.tsx`, único Context de
  la app): expone `useMobileNav()` con `{ mobileNavOpen, toggleMobileNav,
  closeMobileNav }`. Envuelve toda la app desde `src/app/layout.tsx`.
- **Drawer mobile**, dentro del propio `Sidebar.tsx`: cuando `mobileNavOpen` es
  `true`, renderiza (siempre `md:hidden`, nunca convive con el sidebar de escritorio)
  un backdrop (`fixed inset-0 bg-black/40`) + un panel angosto `w-20` **solo con
  íconos** (nunca se expande con texto, a diferencia del hover de escritorio). Cierra
  al elegir una sección, con Escape, o tocando el backdrop.
- **Botón de menú por página**: cada `XxxView.tsx` importa `useMobileNav`, llama
  `const { toggleMobileNav } = useMobileNav();`, y agrega en su header un único botón
  `md:hidden` con ícono `menu` y `onClick={toggleMobileNav}` — no hay contraparte en
  desktop/tablet (ahí el sidebar ya se abre con hover). En pantallas de listado este
  botón reemplaza lo que antes era el ícono `account_circle`; en pantallas de
  detalle/sub-página (solo flecha "volver" + título) se agrega igual al final del
  header, que pasa a `justify-between`.
- El `<nav>` del sidebar de escritorio (colapsado, `md:flex`) tiene `overflow-y-auto`
  para que en landscape con poca altura la lista de íconos scrollee en vez de
  cortarse.

Replicar este mismo patrón (import + hook + botón `menu` `md:hidden`) en cualquier
página nueva.

---

## 6. Patrón de tabla (con paginación)

Referencia: tabla de `PlanesView.tsx`.

- `<thead>`: `<tr className="bg-secondary text-on-secondary">`, celdas
  `px-lg py-4 font-label-bold text-label-bold` (agregar `text-right` en la columna de
  Acciones).
- `<tbody>`: `divide-y divide-border`; filas impares (`i % 2 === 1`) llevan
  `bg-surface-container-lowest` para el zebra-striping.
- Estado vacío: una sola `<tr>` con `<td colSpan={N}>` centrado, texto distinto según
  si no hay datos en absoluto o si la búsqueda no encontró nada.
- **Búsqueda**: filtra en el cliente con `useMemo` sobre el array ya cargado por el
  Server Component (no hay paginación server-side todavía — a este volumen de datos,
  un solo gimnasio, no hace falta).
- **Paginación**: selector "Mostrar [10/25/50]" en el header de la card + footer con
  "Mostrando X-Y de Z resultados" y controles prev/números de página/next. Cambiar el
  buscador o el page size siempre resetea a la página 1.

---

## 7. Componentes reutilizables

- **`Modal`** (`src/components/Modal.tsx`): overlay + panel centrado, cierra con click
  afuera o `Escape`. Props: `title`, `onClose`, `children`, `maxWidth` opcional. Usarlo
  para cualquier formulario o contenido que deba aparecer superpuesto.
- **`ConfirmModal`** (`src/components/ConfirmModal.tsx`): construido sobre `Modal`.
  Props: `title`, `message`, `confirmLabel`, `danger` (estilo rojo), `pending`,
  `onConfirm`, `onCancel`. Usarlo para **toda** confirmación destructiva (baja,
  eliminación).

Ejemplo de formulario reutilizable en dos modos: `src/app/planes/PlanFormModal.tsx`
(`mode="create" | "edit"`, mismo componente para alta y edición, evita duplicar el
formulario).

---

## 8. Formularios

- Cada campo: `<label className="font-label-bold text-label-bold text-on-surface-variant">`
  seguido del input con `mt-1`.
- Input estándar: `w-full border border-border rounded-lg px-3 py-2 outline-none
  focus:border-primary-container`.
- Selects: mismas clases que los inputs.
- Checkbox con label inline: `flex items-center gap-2 text-caption font-caption`.
- **Prefijo dentro de un input** (ej. símbolo de moneda): envolver en
  `<div className="relative">`, un `<span className="absolute left-3 top-1/2
  -translate-y-1/2 ... pointer-events-none">$</span>` y sumarle `pl-7` al input
  (ver el campo Precio en `PlanFormModal.tsx`).
- Errores de acción: un `<div className="bg-error/10 border border-error/30
  text-error rounded-lg p-sm text-body-sm">` arriba del formulario, seteado desde el
  `error` que devuelve la Server Action.

---

## 9. Botones

| Variante | Clases | Uso |
|---|---|---|
| Primario | `bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-label-bold text-label-bold hover:opacity-90` | Acción principal de la pantalla ("Nuevo Plan", "Guardar"). |
| Secundario / Cancelar | `border border-border text-on-surface-variant px-lg py-2 rounded-lg font-label-bold text-label-bold` | Cancelar dentro de modales. |
| Peligro | `bg-error text-on-primary px-lg py-2 rounded-lg font-label-bold text-label-bold` | Confirmar una acción destructiva (botón "Eliminar" del `ConfirmModal`). |
| Ícono / acción de fila | `p-2 rounded-lg transition-colors hover:bg-<color>/10` con un `<span className="material-symbols-outlined text-[20px]">` adentro | Acciones de tabla (ver, editar, activar/desactivar, eliminar). El color del ícono indica la semántica: `text-info` editar, `text-error` eliminar, `text-success`/`text-on-surface-variant` para toggles. |

Todos los botones que disparan una Server Action deben deshabilitarse mientras
`isPending` (de `useTransition`) es `true`.

---

## 10. Badges de estado

`<span className="px-3 py-1 rounded-full text-caption font-label-bold ...">`, con el
color de fondo/texto semántico correspondiente (ver tabla de colores, sección 2). Para
badges informativos no-semánticos (ej. "3x/semana") usar `bg-info/10 text-info`.

---

## 11. Iconografía

**Material Symbols Outlined** (cargado globalmente en `src/app/layout.tsx` via Google
Fonts, clase `material-symbols-outlined`). Tamaños estándar:

- `20px` (`text-[20px]`) en íconos de acciones de tabla.
- `18px` (`text-[18px]`) en íconos dentro de badges o botones chicos (ej. el ícono de
  "group" en la columna Alumnos, o el ícono del botón "Nuevo Plan").
- Sin tamaño explícito (hereda `24px` por defecto) en el Sidebar y en headers.

No usar otra librería de íconos (Font Awesome, Lucide, etc.) — mantener una sola
fuente de iconografía en todo el proyecto.

---

## 12. Convención de archivos por módulo

Usando Planes como plantilla, un módulo nuevo `xxx` se arma así:

```
src/app/xxx/
  page.tsx           Server Component: fetch de data.ts, renderiza Sidebar + XxxView
  data.ts             Queries de lectura (getXxx, getXxxDetalle)
  actions.ts          Server Actions de escritura (crearXxx, actualizarXxx, eliminarXxx...)
  XxxView.tsx          Client Component: header, toolbar, tabla, estado de UI
  XxxFormModal.tsx      Modal de alta/edición (mode create/edit)
  [id]/                 (si el módulo tiene página de detalle)
    page.tsx
    data.ts             (puede reexportar getDisciplinas-equivalentes del módulo padre)
    XxxDetalleView.tsx
```

---

## 13. Checklist para armar un módulo nuevo

1. Migración SQL si hace falta una tabla nueva (`supabase/migrations/000N_xxx.sql`),
   aplicar con `npx supabase db push --linked`.
2. `src/lib/supabase/types.ts`: agregar los tipos de fila nuevos.
3. `data.ts`: funciones de lectura, siguiendo el patrón de `getPlanes()` (joins
   embebidos donde PostgREST lo permite, consultas separadas + `Map` en JS cuando no).
4. `actions.ts`: Server Actions con validación server-side y `ActionResult` como
   retorno; `revalidatePath()` de todas las rutas afectadas (lista y, si existe,
   detalle).
5. `XxxFormModal.tsx` sobre `Modal`, modo create/edit.
6. `XxxView.tsx`: header + toolbar + tabla paginada/con búsqueda + modales
   (`XxxFormModal`, `ConfirmModal` para bajas).
7. `page.tsx`: `Sidebar` + `XxxView`.
8. Sumar la ruta a `RUTAS_IMPLEMENTADAS` en `src/components/Sidebar.tsx` para que deje
   de aparecer deshabilitada en la navegación.
9. `npm run build` para validar tipos, y probar el flujo completo en el navegador
   (alta, edición, baja/eliminación, búsqueda, paginación).
