# Centro RM — Modelo de Datos

Diseño de base de datos (Postgres / Supabase) para un solo gimnasio (single-tenant).
Cubre: alumnos, profesores con especialidades, turnos, planes de entrenamiento con
precios, cuotas con prorrateo, pagos, asistencia (alumnos y profesores), reservas,
rutinas y seguimiento físico.

> **Estado de implementación:** este documento describe el modelo completo (algunas
> tablas todavía son aspiracionales, ej. `profesor`, `clase`, `cuota`, `rutina`).
> Lo ya migrado a la base real vive en `supabase/migrations/`:
> `0001_planes.sql` (disciplina, usuario mínimo, plan + precios, promocion, alumno
> mínimo, inscripcion) y `0002_alumnos_promociones.sql` (turno, alumno completo con
> DNI, `promocion_plan`, seed de un usuario admin). Donde el código real difiere de
> este doc (por simplificación o por no estar construido todavía), se aclara inline.

---

## 1. Entidades principales y relaciones

```
Disciplina 1───N Profesor_Especialidad N───1 Profesor
Disciplina 1───N Plan
Plan 1───N PlanPrecioHistorico
Plan 1───N Inscripcion N───1 Alumno
Inscripcion 1───N Cuota 1───N Pago
Turno 1───N Clase N───1 Profesor
Clase N───1 Disciplina
Clase 1───N Reserva N───1 Alumno
Clase 1───N AsistenciaAlumno N───1 Alumno
Turno/Clase 1───N AsistenciaProfesor N───1 Profesor
Alumno 1───N Rutina N───1 Profesor
Rutina 1───N RutinaEjercicio N───1 Ejercicio
Alumno 1───N Progreso
Alumno/Profesor 1───N Notificacion
```

**Decisión clave de normalización:** `Disciplina` (Musculación, Spinning, CrossFit, GAP,
Funcional, etc.) es una sola tabla, referenciada tanto por las especialidades de los
profesores como por los planes de entrenamiento que se venden. Evita duplicar el
catálogo de disciplinas en dos lugares distintos.

---

## 2. Schema SQL (Postgres)

```sql
-- =========================================================
-- CATÁLOGOS BASE
-- =========================================================

create table disciplina (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,          -- 'Musculación', 'Spinning', 'CrossFit', 'GAP'
  descripcion   text,
  activo        boolean not null default true
);

create table turno (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,                 -- 'Mañana', 'Tarde', 'Noche'
  hora_inicio   time not null,
  hora_fin      time not null
);

-- =========================================================
-- PERSONAS
-- =========================================================

-- 'admin' NO es un tipo de persona aparte: es un permiso que se otorga a un profesor.
-- Un usuario es, en su naturaleza, profesor o alumno; opcionalmente un profesor
-- puede tener además el permiso de administrador (ej. el dueño / profesor principal).
create type tipo_usuario as enum ('profesor', 'alumno');

create table usuario (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  password_hash   text not null,
  tipo            tipo_usuario not null,
  es_admin        boolean not null default false,
  activo          boolean not null default true,
  creado_en       timestamptz not null default now(),
  constraint solo_profesor_puede_ser_admin
    check (not es_admin or tipo = 'profesor')
);

create type estado_persona as enum ('activo', 'inactivo', 'de_baja', 'suspendido');

create table profesor (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid references usuario(id),
  nombre          text not null,
  apellido        text not null,
  email           text,
  telefono        text,
  fecha_alta      date not null default current_date,
  estado          estado_persona not null default 'activo',
  foto_url        text
);

create table profesor_especialidad (
  profesor_id     uuid references profesor(id) on delete cascade,
  disciplina_id   uuid references disciplina(id) on delete restrict,
  nivel           text,                          -- 'Instructor', 'Avanzado', etc. (opcional)
  primary key (profesor_id, disciplina_id)
);

-- Implementado en supabase/migrations/0002_alumnos_promociones.sql. Único campo
-- obligatorio: dni (nombre/apellido quedaron nullable a propósito — se puede
-- registrar un alumno solo con el DNI y completar el resto después). `genero`,
-- `objetivo` y `foto_url` de este doc son aspiracionales, todavía no se
-- implementaron (se agregan si hace falta más adelante).
create table alumno (
  id                uuid primary key default gen_random_uuid(),
  usuario_id        uuid references usuario(id),
  dni               text not null unique,
  nombre            text,
  apellido          text,
  email             text,
  celular           text,
  fecha_nacimiento  date,
  turno_id          uuid references turno(id),
  altura            numeric(5,2),                 -- cm
  peso              numeric(5,2),                 -- kg
  fecha_alta        date not null default current_date,
  estado            estado_persona not null default 'activo'
);

-- =========================================================
-- PLANES DE ENTRENAMIENTO Y PRECIOS
-- =========================================================

-- Frecuencia semanal del plan: 1 a 7 días, o null = "libre / todos los días"
create table plan (
  id                  uuid primary key default gen_random_uuid(),
  disciplina_id       uuid not null references disciplina(id),
  nombre              text not null,             -- 'Musculación 3x semana', 'Musculación Libre'
  dias_por_semana     smallint,                  -- 3, 5, null = acceso libre / todos los días
  acceso_libre        boolean not null default false,
  descripcion         text,
  activo              boolean not null default true,
  creado_en           timestamptz not null default now()
);

-- Historial de precios: permite cambiar precios (inflación) sin romper cuotas ya emitidas
create table plan_precio_historico (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references plan(id) on delete cascade,
  precio          numeric(12,2) not null,
  vigente_desde   date not null,
  vigente_hasta   date,                          -- null = precio actual vigente
  constraint precio_positivo check (precio > 0)
);

-- Catálogo simple de promociones (campañas con nombre y vigencia), a fines de
-- trazabilidad y reportes ("¿cuántos alumnos entraron con la promo de verano?").
-- El monto real que paga cada alumno se define por inscripción (ver más abajo),
-- no acá: la promoción es la "etiqueta", el precio lo fija el admin caso por caso.
create table promocion (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,              -- 'Promo Verano 2026', 'Convenio Empresa X'
  descripcion     text,
  fecha_inicio    date,
  fecha_fin       date,
  activa          boolean not null default true
);

-- Una promoción puede aplicar a varios planes (M:N). Se gestiona desde el módulo
-- de Planes (pantalla /planes/promociones): al elegir un plan en el alta de un
-- alumno, el selector de promociones se filtra por esta relación.
create table promocion_plan (
  promocion_id    uuid not null references promocion(id) on delete cascade,
  plan_id         uuid not null references plan(id) on delete cascade,
  primary key (promocion_id, plan_id)
);

-- Un alumno inscripto a un plan (puede tener más de una inscripción histórica)
create type estado_inscripcion as enum ('activa', 'pausada', 'finalizada');

create table inscripcion (
  id                  uuid primary key default gen_random_uuid(),
  alumno_id           uuid not null references alumno(id),
  plan_id             uuid not null references plan(id),
  turno_id            uuid references turno(id),
  fecha_inicio        date not null,
  fecha_fin           date,
  estado              estado_inscripcion not null default 'activa',

  -- Precio promocional / acordado: si está seteado, las cuotas de ESTA inscripción
  -- usan este monto en vez del precio de lista vigente del plan (plan_precio_historico).
  precio_acordado     numeric(12,2),
  promocion_id        uuid references promocion(id),
  autorizado_por      uuid references usuario(id),   -- quién habilitó el precio especial

  constraint precio_acordado_requiere_autorizacion
    check (precio_acordado is null or autorizado_por is not null)
);

-- =========================================================
-- CLASES (horario concreto: disciplina + profesor + turno + cupo)
-- =========================================================

create table clase (
  id              uuid primary key default gen_random_uuid(),
  disciplina_id   uuid not null references disciplina(id),
  profesor_id     uuid not null references profesor(id),
  turno_id        uuid not null references turno(id),
  dia_semana      smallint not null check (dia_semana between 0 and 6), -- 0=domingo
  hora_inicio     time not null,
  hora_fin        time not null,
  cupo_maximo     integer not null default 20
);

create type estado_reserva as enum ('reservada', 'cancelada', 'asistio', 'ausente');

create table reserva (
  id              uuid primary key default gen_random_uuid(),
  alumno_id       uuid not null references alumno(id),
  clase_id        uuid not null references clase(id),
  fecha           date not null,
  estado          estado_reserva not null default 'reservada',
  creado_en       timestamptz not null default now(),
  unique (alumno_id, clase_id, fecha)
);

-- =========================================================
-- CONFIGURACIÓN DE VENCIMIENTOS Y RECARGOS
-- =========================================================

-- Fila única (o versionada por vigente_desde si en el futuro cambia el criterio).
-- Ejemplo: dias_gracia=5, tipo_recargo='porcentaje', valor_recargo=10
--   -> cuota vence el 10, queda 'adeudada' del 10 al 15, si al día 16 no hay pago
--      pasa a 'vencida' y se le suma 10% de recargo sobre monto_final.
create type tipo_recargo as enum ('porcentaje', 'monto_fijo');

create table configuracion_pagos (
  id              uuid primary key default gen_random_uuid(),
  dias_gracia     smallint not null default 5,
  tipo_recargo    tipo_recargo not null default 'porcentaje',
  valor_recargo   numeric(12,2) not null default 10,
  vigente_desde   date not null default current_date,
  activo          boolean not null default true
);

-- =========================================================
-- CUOTAS, PAGOS Y PRORRATEO
-- =========================================================

-- 'adeudada': generada y sin pago, todavía dentro del rango de gracia post-vencimiento.
-- 'vencida': pasó el rango de gracia sin pago -> se le aplica recargo.
create type estado_cuota as enum ('adeudada', 'pagada', 'vencida', 'anulada');

create type motivo_cuota as enum (
  'alta', 'mensual', 'cambio_plan_saliente', 'cambio_plan_entrante', 'baja'
);

create table cuota (
  id                  uuid primary key default gen_random_uuid(),
  inscripcion_id      uuid not null references inscripcion(id),
  periodo             date not null,             -- primer día del mes que factura, ej 2026-08-01
  motivo              motivo_cuota not null default 'mensual',
  monto_base          numeric(12,2) not null,     -- precio de lista del plan vigente
  es_prorrateada      boolean not null default false,
  dias_del_mes        smallint,                   -- solo si es_prorrateada
  dias_facturados     smallint,                   -- solo si es_prorrateada
  monto_final         numeric(12,2) not null,      -- monto_base o el prorrateado, sin recargo
  fecha_vencimiento   date not null,
  estado              estado_cuota not null default 'adeudada',
  fecha_paso_a_vencida date,                       -- se completa cuando estado pasa a 'vencida'
  recargo_aplicado    numeric(12,2) not null default 0,
  creado_en           timestamptz not null default now(),
  unique (inscripcion_id, periodo, motivo)
);

-- monto_total_a_pagar = monto_final + recargo_aplicado (calculado en el backend, no columna generada
-- para poder auditar el detalle del recargo tal como se cobró)

create type medio_pago as enum ('efectivo', 'transferencia', 'mercadopago', 'tarjeta');

create table pago (
  id              uuid primary key default gen_random_uuid(),
  cuota_id        uuid not null references cuota(id),
  monto           numeric(12,2) not null,
  fecha_pago      timestamptz not null default now(),
  medio           medio_pago not null,
  referencia      text,                          -- nro. de operación MP / transferencia
  registrado_por  uuid references usuario(id)
);

-- Comprobante interno (no es factura fiscal AFIP) que se envía al alumno tras el pago
create type canal_envio_comprobante as enum ('whatsapp', 'email', 'descarga_manual');

create table comprobante_pago (
  id                  uuid primary key default gen_random_uuid(),
  pago_id             uuid not null unique references pago(id) on delete cascade,
  numero              text not null unique,        -- ej. '2026-000184', correlativo
  pdf_url             text,                         -- documento generado (storage)
  enviado             boolean not null default false,
  canal_envio         canal_envio_comprobante,
  fecha_envio         timestamptz,
  creado_en           timestamptz not null default now()
);

-- =========================================================
-- ASISTENCIA (alumnos y profesores son cosas DISTINTAS)
-- =========================================================

create table asistencia_alumno (
  id              uuid primary key default gen_random_uuid(),
  alumno_id       uuid not null references alumno(id),
  clase_id        uuid references clase(id),      -- null si es ingreso libre (musculación libre)
  fecha           date not null,
  hora_registro   timestamptz not null default now(),
  presente        boolean not null default true
);

create type estado_asistencia_profesor as enum ('presente', 'ausente', 'tarde', 'justificado');

create table asistencia_profesor (
  id              uuid primary key default gen_random_uuid(),
  profesor_id     uuid not null references profesor(id),
  clase_id        uuid references clase(id),
  turno_id        uuid references turno(id),
  fecha           date not null,
  hora_entrada    timestamptz,
  hora_salida     timestamptz,
  estado          estado_asistencia_profesor not null default 'presente',
  observaciones   text
);

-- =========================================================
-- RUTINAS Y PROGRESO FÍSICO
-- =========================================================

create table ejercicio (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null unique,
  grupo_muscular  text
);

-- Nota de negocio (todavía no implementada): un alumno tiene como máximo 2 rutinas
-- activas simultáneas, y cada rutina tiene una temporalidad típica de ~2 meses antes
-- de renovarse/reemplazarse. Cuando se construya este módulo, agregar un campo de
-- vigencia (ej. fecha_inicio/fecha_fin, análogo a inscripcion) y un constraint o
-- validación en la Server Action que impida más de 2 rutinas activas por alumno.
create table rutina (
  id              uuid primary key default gen_random_uuid(),
  alumno_id       uuid not null references alumno(id),
  profesor_id     uuid not null references profesor(id),
  nombre          text not null,
  activa          boolean not null default true,
  creado_en       timestamptz not null default now()
);

create table rutina_ejercicio (
  id              uuid primary key default gen_random_uuid(),
  rutina_id       uuid not null references rutina(id) on delete cascade,
  ejercicio_id    uuid not null references ejercicio(id),
  orden           smallint not null default 0,
  series          smallint,
  repeticiones    text,                          -- '8-10' admite rangos
  peso_kg         numeric(6,2),
  observaciones   text
);

create table progreso (
  id              uuid primary key default gen_random_uuid(),
  alumno_id       uuid not null references alumno(id),
  fecha           date not null default current_date,
  peso_kg         numeric(6,2),
  medidas         jsonb,                         -- {"cintura": 80, "pecho": 100, ...}
  foto_url        text
);

-- =========================================================
-- NOTIFICACIONES
-- =========================================================

create type tipo_notificacion as enum ('cuota_por_vencer', 'cuota_vencida', 'motivacional', 'promocion', 'aviso');

create table notificacion (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null references usuario(id),
  tipo            tipo_notificacion not null,
  titulo          text not null,
  mensaje         text not null,
  leida           boolean not null default false,
  creado_en       timestamptz not null default now()
);
```

---

## 3. Motor de estados de cuota y recargos por mora

Tres estados visibles para el admin (coinciden con lo que pidió el profesor principal):
**Pagada**, **Adeudada**, **Vencida** (+ `anulada` para casos administrativos, ej. baja
retroactiva).

**Transición de estados** (evaluada por un job diario — ver más abajo):

```
fecha_actual ≤ fecha_vencimiento + dias_gracia   →  ADEUDADA  (sin recargo)
fecha_actual > fecha_vencimiento + dias_gracia   →  VENCIDA   (con recargo)
pago registrado que cubre el total                →  PAGADA   (en cualquier momento)
```

**Cálculo del recargo**, al momento en que una cuota pasa a `vencida`:

```
si tipo_recargo = 'porcentaje':  recargo_aplicado = monto_final * (valor_recargo / 100)
si tipo_recargo = 'monto_fijo':  recargo_aplicado = valor_recargo

monto_total_a_pagar = monto_final + recargo_aplicado
```

El recargo se calcula **una sola vez**, en el momento de la transición a `vencida`, y
queda guardado en `cuota.recargo_aplicado` (no se recalcula día a día) — así el monto a
cobrar es estable y auditable aunque el admin cambie la configuración después. Si en el
futuro el gimnasio quiere recargos que se acumulan cada N días de mora adicionales, es
una variante a definir con vos más adelante (no incluida en el MVP).

**Implementación:** un job diario (cron / Supabase Edge Function programada) recorre las
cuotas en estado `adeudada` cuya `fecha_vencimiento + dias_gracia < hoy`, las pasa a
`vencida`, calcula `recargo_aplicado` con la `configuracion_pagos` vigente, y completa
`fecha_paso_a_vencida`. También dispara la notificación `cuota_vencida` (módulo G).

---

## 4. Lógica de prorrateo (por días del mes)

Regla acordada: **prorrateo por días calendario del mes**.

```
monto_final = round( (monto_base / dias_del_mes) * dias_facturados , 2 )
```

- `dias_del_mes`: cantidad de días del mes calendario en el que se genera la cuota
  (28/29/30/31, usar `extract(day from (date_trunc('month', periodo) + interval '1 month - 1 day'))`).
- `dias_facturados`: desde `fecha_inicio` de la inscripción (inclusive) hasta el fin de
  ese mes calendario (inclusive).
- Se aplica **solo** en el primer período de cada inscripción (alta a mitad de mes) y en
  el último período si hay baja a mitad de mes con `fecha_fin` seteada. Los meses
  completos intermedios facturan `monto_base` sin prorrateo.
- `monto_base` toma el precio vigente de `plan_precio_historico` para la fecha del
  período, no el precio "actual" del plan — así un cambio de precio no altera cuotas ya
  emitidas.

**Precio promocional (por inscripción):** si la `inscripcion` tiene `precio_acordado`
seteado, ese valor reemplaza al precio de lista como `monto_base` de todas las cuotas de
esa inscripción — el prorrateo se sigue calculando igual, solo cambia la base:

```
monto_base = inscripcion.precio_acordado ?? precio_vigente(plan, período)
```

Solo un profesor con `es_admin = true` puede cargar `precio_acordado` (por eso
`autorizado_por` es obligatorio cuando se define uno). Esto cubre el caso de
promociones puntuales al dar de alta a un alumno (ej. "Promo Verano", convenios,
descuentos por grupo familiar) sin tener que crear un plan nuevo en el catálogo por
cada excepción de precio.

**Cambio de plan a mitad de mes (definido):** se generan **dos cuotas prorrateadas**,
una por cada plan, ambas dentro del mismo período. El modelo ya lo soporta sin cambios
de estructura, porque un cambio de plan es en realidad **cerrar una inscripción y abrir
otra**:

1. Se actualiza la `inscripcion` vigente: `fecha_fin = día_del_cambio - 1`, `estado = 'finalizada'`.
   → Esto genera su cuota final prorrateada (`monto_base` del plan viejo, días desde el
   1º del mes o desde el inicio de la inscripción hasta `fecha_fin`).
2. Se crea una nueva `inscripcion` con el plan nuevo: `fecha_inicio = día_del_cambio`.
   → Esto genera su cuota inicial prorrateada (`monto_base` del plan nuevo, días desde
   `fecha_inicio` hasta fin de mes).

Como la restricción `unique (inscripcion_id, periodo)` es por inscripción y no por
alumno, ambas cuotas del mismo mes conviven sin conflicto. Para trazabilidad conviene
sumar un campo `motivo` a `cuota` (`alta`, `mensual`, `cambio_plan_saliente`,
`cambio_plan_entrante`, `baja`) — lo agrego en el schema de la sección 2 si te parece
bien antes de implementarlo.

Este cálculo se implementa como función pura en el backend (ej. `calcularProrrateo()`),
no en la base — así queda testeable con casos límite (alta el día 1, alta el día 31 de un
mes de 30 días, año bisiesto, etc.).

---

## 5. Ejemplo de catálogo inicial de planes

| Disciplina | Plan | Días/semana | Precio ejemplo |
|---|---|---|---|
| Musculación | Musculación 3x semana | 3 | $15.000 |
| Musculación | Musculación Libre (todos los días) | Libre | $22.000 |
| Spinning | Spinning 2x semana | 2 | $12.000 |
| Spinning | Spinning 3x semana | 3 | $16.000 |
| CrossFit | CrossFit 3x semana | 3 | $20.000 |
| CrossFit | CrossFit Libre | Libre | $28.000 |
| GAP | GAP 2x semana | 2 | $11.000 |

(Los precios son placeholder — se cargan reales desde la pantalla de Configuración /
Gestión de Planes.)

---

## 6. Rol de administrador

Definido: **el administrador no es un tipo de persona aparte, es un permiso sobre un
profesor**. `usuario.tipo` solo distingue `profesor` / `alumno`; `usuario.es_admin`
(booleano, con constraint que solo puede ser `true` si `tipo = 'profesor'`) habilita el
acceso administrativo completo (gestión de alumnos, profesores, planes, cuotas,
reportes). Un gimnasio puede tener uno o varios profesores con `es_admin = true` (ej. el
dueño y un encargado), y el resto de los profesores acceden solo a su propio subset:
sus clases, sus alumnos, tomar asistencia, cargar rutinas — sin ver cuotas ni
configuración general.

**Workaround temporal sin autenticación:** hasta que exista login real, la app
(`src/lib/supabase/server.ts`) se conecta con la service role key, sin sesión de
usuario — no hay forma de saber "quién está logueado". Por eso, cuando una Server
Action necesita completar `inscripcion.autorizado_por` (precio promocional), busca
`select id from usuario where es_admin = true limit 1` y usa ese usuario. La migración
`0002_alumnos_promociones.sql` siembra un usuario admin único para este propósito. El
día que se implemente autenticación de verdad, este workaround se reemplaza por el
usuario de la sesión actual.

## 7. Preguntas abiertas para vos

1. ¿Un alumno puede tener más de un plan activo simultáneamente (ej. Musculación +
   Spinning)? El modelo ya lo permite (múltiples `inscripcion` activas por alumno), solo
   falta confirmar si eso se factura en una sola cuota combinada o en cuotas separadas
   por plan (el schema actual las genera separadas, una por inscripción — más simple y
   ya cubre el caso).
2. ¿Los profesores cobran por clase dictada, fijo, o eso queda fuera del sistema por
   ahora? (no lo pediste, pero la tabla `asistencia_profesor` deja la puerta abierta para
   liquidación de sueldos a futuro si hace falta).
3. El recargo por mora: ¿se aplica una única vez al pasar a `vencida` (como lo dejé
   definido por defecto), o se va acumulando cada cierta cantidad de días adicionales de
   atraso (ej. +10% a los 5 días de gracia, +5% más cada 10 días adicionales)? Con la
   primera opción el sistema es más simple y predecible para el alumno; avisame si el
   gimnasio necesita la segunda.
