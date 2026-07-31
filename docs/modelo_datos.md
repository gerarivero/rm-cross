# Centro RM — Modelo de Datos

Diseño de base de datos (Postgres / Supabase) para un solo gimnasio (single-tenant).
Cubre: alumnos, profesores con especialidades, turnos, planes de entrenamiento con
precios, cuotas con prorrateo, pagos, asistencia (alumnos y profesores), reservas,
rutinas y seguimiento físico.

> **Estado de implementación:** este documento describe el modelo completo (algunas
> tablas todavía son aspiracionales, ej. `profesor`, `clase`, `rutina`).
> Lo ya migrado a la base real vive en `supabase/migrations/`:
> `0001_planes.sql` (disciplina, usuario mínimo, plan + precios, promocion, alumno
> mínimo, inscripcion), `0002_alumnos_promociones.sql` (turno, alumno completo con
> DNI, `promocion_plan`, seed de un usuario admin), `0003_fotos_alumno.sql`
> (foto_inicial_url/foto_actual_url + bucket de Storage) y `0004_cuotas.sql`
> (`configuracion_pagos`, `cuota`, `pago`). Donde el código real difiere de este doc
> (por simplificación o por no estar construido todavía), se aclara inline — el caso
> más importante es **cuotas**: lo implementado usa un ciclo por aniversario sin
> prorrateo (sección 3 más abajo), distinto del ciclo por mes calendario con
> prorrateo que describía originalmente este documento.

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
-- CONFIGURACIÓN DE VENCIMIENTOS, CUOTAS Y PAGOS
-- Implementado tal cual en supabase/migrations/0004_cuotas.sql — ver sección 3
-- para el motor de estados (ciclo por aniversario, sin prorrateo, sin cron).
-- =========================================================

-- Fila única. Seed: dias_gracia=10, tipo_recargo='porcentaje', valor_recargo=10.
create table configuracion_pagos (
  id              uuid primary key default gen_random_uuid(),
  dias_gracia     smallint not null default 10,
  tipo_recargo    text not null default 'porcentaje' check (tipo_recargo in ('porcentaje', 'monto_fijo')),
  valor_recargo   numeric(12,2) not null default 10,
  actualizado_en  timestamptz not null default now()
);

create type estado_cuota as enum ('adeudada', 'pagada', 'vencida', 'anulada');

-- periodo_desde = fecha_inicio de la inscripción; periodo_hasta = fecha_vencimiento
-- = periodo_desde + 1 mes (ciclo por aniversario). Sin campos de prorrateo: siempre
-- se cobra monto_base completo. recargo_aplicado queda en 0 hasta que se registra
-- un pago fuera de la ventana de gracia (ver src/app/cuotas/estado.ts).
create table cuota (
  id                  uuid primary key default gen_random_uuid(),
  inscripcion_id      uuid not null references inscripcion(id),
  periodo_desde       date not null,
  periodo_hasta       date not null,
  fecha_vencimiento   date not null,
  monto_base          numeric(12,2) not null check (monto_base > 0),
  recargo_aplicado    numeric(12,2) not null default 0,
  estado              estado_cuota not null default 'adeudada',
  creado_en           timestamptz not null default now(),
  unique (inscripcion_id, periodo_desde)
);

create table pago (
  id              uuid primary key default gen_random_uuid(),
  cuota_id        uuid not null references cuota(id),
  monto           numeric(12,2) not null,
  fecha_pago      timestamptz not null default now(),
  medio           text not null check (medio in ('efectivo', 'transferencia', 'mercadopago', 'tarjeta')),
  referencia      text,                          -- nro. de operación MP / transferencia
  registrado_por  uuid references usuario(id)
);
```

**Eliminar un alumno borra en cascada** (`supabase/migrations/0005_eliminar_alumno_en_cascada.sql`):
`inscripcion.alumno_id`, `cuota.inscripcion_id` y `pago.cuota_id` están en
`on delete cascade`, así que borrar un `alumno` se lleva puesto todo su historial de
inscripciones, cuotas y pagos. Es una decisión de negocio explícita, distinta de
`inscripcion.plan_id` (que sigue en `on delete restrict`, sin cambios) — **el plan
nunca se borra ni se ve afectado** al eliminar un alumno, solo el vínculo y los
registros que dependen de esa inscripción puntual.

```sql

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

## 3. Motor de estados de cuota y recargos por mora (implementado, `0004_cuotas.sql`)

> Esta sección reemplaza el diseño original de más abajo (ciclo por mes calendario con
> prorrateo). Definición final, cerrada con el profesor principal: **ciclo por
> aniversario, sin prorrateo**.

**Ciclo por aniversario, pago por adelantado:** cada cuota cubre 1 mes exacto desde
`inscripcion.fecha_inicio` (no desde el 1º del mes calendario), y **se paga por
adelantado, no a mes vencido** — el alumno tiene que estar al día ANTES de empezar a
entrenar ese período, no después de usarlo. Por eso `fecha_vencimiento` de una cuota es
el mismo día en que arranca su período (`periodo_desde`), no el día en que termina:

```
periodo_desde      = inicio del período (fecha_inicio de la inscripción, para la cuota 1)
periodo_hasta       = periodo_desde + 1 mes (sumarMeses(), respeta fin de mes: 31/ene → 28/29 feb)
fecha_vencimiento   = periodo_desde   -- ¡no periodo_hasta!
```

Ejemplo real: alta el 29/jul → cuota 1 con `periodo_desde = 29/jul`,
`periodo_hasta = 29/ago`, `fecha_vencimiento = 29/jul`. Con 10 días de gracia, la fecha
límite de pago sin recargo es el **8/ago**. La cuota 2 (mes siguiente, generación
todavía no implementada — ver "Fuera de alcance") tendría `periodo_desde =
fecha_vencimiento = 29/ago` otra vez, con su propia fecha límite el 8/sep.
`periodo_hasta` queda solo como referencia del rango cubierto, no participa en el
cálculo de vencimiento/gracia.

**Sin prorrateo:** la inscripción siempre genera la cuota por el monto completo —
`inscripcion.precio_acordado` si se aplicó una promoción al dar de alta, o si no el
precio vigente del plan en `plan_precio_historico`. Nunca se cobra un monto parcial.
(El profesor principal pidió originalmente la opción de prorratear el primer mes, pero
al no encajar con un ciclo por aniversario —no hay período parcial que prorratear—
se descartó explícitamente a favor de este modelo más simple.)

Tres estados visibles para el admin: **Pagada**, **Adeudada**, **Vencida** (+ `anulada`
reservado para casos administrativos, sin uso todavía).

```
fecha_actual ≤ fecha_vencimiento + dias_gracia   →  ADEUDADA  (sin recargo)
fecha_actual > fecha_vencimiento + dias_gracia   →  VENCIDA   (con recargo)
suma de pagos ≥ monto_base                        →  PAGADA   (en cualquier momento)
```

`dias_gracia` por defecto es **10** (`configuracion_pagos`, editable desde la pantalla
de Cuotas).

**Pagos parciales y saldo (implementado, `0006_pagos_parciales.sql`):** una cuota puede
tener varios `pago` asociados (pago total en una vez, o varios pagos parciales). El
saldo de capital pendiente es siempre `monto_base - suma(pago.monto)`. La cuota pasa a
`Pagada` recién cuando ese saldo llega a 0 (o menos). Mientras haya saldo pendiente, la
pantalla de Cuotas muestra tanto el saldo (columna "Saldo") como el detalle de cada pago
parcial hecho hasta la fecha (acción "Ver Detalle").

**Cálculo del recargo — sobre el saldo, no sobre el monto_base completo:**

```
si tipo_recargo = 'porcentaje':  recargo = saldo_al_vencer * (valor_recargo / 100)
si tipo_recargo = 'monto_fijo':  recargo = valor_recargo
```

`saldo_al_vencer = monto_base - suma(pagos con fecha_pago <= fecha_vencimiento + dias_gracia)`.
Es decir: los pagos hechos **antes** de que la cuota entre en mora reducen la base sobre
la que se calcula el interés (si alguien ya pagó parte antes de vencer, el recargo es
menor). Los pagos hechos **después** de vencida solo descuentan del total a pagar, pero
no vuelven a recalcular el interés ya generado — si no, el interés "desaparecería" con
solo pagar el capital y dejar el recargo sin abonar. El total adeudado hoy sobre una
cuota vencida es siempre `saldo_capital_actual + recargo` (`src/app/cuotas/estado.ts`,
función `calcularEstadoCuota`).

**Sin cron job (decisión técnica):** no hay infraestructura de tareas programadas
todavía, así que en vez de un job diario que actualice `cuota.estado` a `vencida` día a
día, el estado `Vencida`, el recargo y el saldo se **calculan al vuelo** con la función
pura `calcularEstadoCuota()` (`src/app/cuotas/estado.ts`), a partir de `monto_base`,
`fecha_vencimiento` y la lista completa de `pago` de la cuota — tanto para mostrar la
lista de cuotas como en el momento exacto de registrar un pago. Cuando la suma de pagos
cubre el total (capital + recargo si corresponde), se llama a la función SQL
`asignar_numero_comprobante()`, que marca `cuota.estado = 'pagada'` y le asigna un
número de comprobante correlativo (`cuota.numero_comprobante`, desde la secuencia
`comprobante_numero_seq`) en una sola operación atómica. Mientras nadie termina de
pagar, la fila en la base sigue diciendo `adeudada` aunque ya haya pasado la ventana de
gracia — es coherente: el dato derivado (lo que se ve en pantalla) es correcto, lo único
que no existe es un proceso en background que "cierre" filas viejas.

**Comprobante de pago (implementado):** una vez que una cuota queda `Pagada`, la acción
"Generar Comprobante" abre `/cuotas/[id]/comprobante` — una página imprimible (estilo
del mockup `stitch_rm_design_system/stitch_rm_comprobante_de_pago/`) con el número de
comprobante, el detalle de cada pago (parcial o total) y el recargo si lo hubo. Se
imprime con el diálogo nativo del navegador (`window.print()`); no hay generación de PDF
en el servidor ni envío por WhatsApp/Email todavía.

**Precio promocional (por inscripción):** si la `inscripcion` tiene `precio_acordado`
seteado, ese valor reemplaza al precio de lista como `monto_base` de la cuota. Solo un
profesor con `es_admin = true` puede cargarlo (por eso `autorizado_por` es obligatorio
cuando se define uno) — mismo workaround temporal sin auth real que se explica en la
sección 6.

**Generación automática de la cuota del próximo período (implementado):** cuando una
cuota queda 100% pagada (`registrarPago`, justo después de `asignar_numero_comprobante`),
se genera automáticamente la cuota del período siguiente — sin cron ni botón manual,
disparada por esa misma acción de pago (`crearProximaCuota`, `src/app/cuotas/actions.ts`).
`periodo_desde` de la cuota nueva es el `periodo_hasta` de la que se acaba de pagar
(mismo criterio del ejemplo del 29/jul de más arriba). El monto se resuelve igual que en
el alta: `precio_acordado` de la inscripción si existe (una promoción sigue aplicando
período tras período), si no el precio de lista **vigente en ese momento** — así un
aumento de precio ya se refleja en la próxima cuota, no el precio que tenía la anterior.
Si la inscripción ya no está `activa` (alumno dado de baja), no se genera nada. Si no hay
precio vigente para el plan, el pago igual queda registrado pero `registrarPago` devuelve
un error ("Pago registrado, pero...") para que quede visible que la próxima cuota no se
pudo generar — deliberado: al no haber otro disparador (se descartó un botón manual), un
fallo silencioso dejaría a un alumno sin facturar sin que nadie lo note.

**Fuera de alcance por ahora:** el envío del comprobante por WhatsApp/Email o su descarga
como PDF generado en el servidor.

**Re-inscripción de alumnos (implementado):** un alumno puede tener varias
`inscripcion` a lo largo del tiempo — el modelo nunca lo impidió (sin constraint de
unicidad sobre `alumno_id`), pero hasta esta vuelta no había ninguna acción que lo
soportara. Ahora:

- Al dar de baja a un alumno (`alumno.estado = 'de_baja'` desde "Editar"), se cierra
  automáticamente su `inscripcion` activa: `estado = 'finalizada'`, `fecha_fin = hoy`.
  Así la duración de ese período queda registrada con precisión, en vez de quedar
  abierta hasta que el alumno (si es que) vuelve.
- La acción **Reinscribir** (visible en el detalle de alumno cuando no tiene plan
  activo) crea una `inscripcion` nueva con un plan y una fecha de inicio elegidos
  (pueden ser distintos a los de la inscripción anterior), reactiva al alumno
  (`estado = 'activo'`) y dispara su cuota inicial con el mismo mecanismo que el alta
  (`crearInscripcionConCuota`, helper compartido con `crearAlumno` en
  `src/app/alumnos/actions.ts`).
- El detalle de alumno muestra un **Historial de Inscripciones** con cada período
  (plan, desde, hasta, duración calculada con `src/app/alumnos/duracion.ts`, y estado),
  incluida la que sigue en curso.
- Fuera de alcance: cambiar de plan a un alumno que ya tiene una inscripción activa
  (implicaría cerrar/prorratear cuotas en curso) — "Reinscribir" solo aplica cuando no
  hay inscripción activa.

**Sincronización de precio con la cuota adeudada (implementado):** todo cambio de
precio — de lista (editar el precio de un plan desde `/planes`) o acordado/promocional
(botón "Editar Precio" en el detalle de alumno, que también permite quitar una
promoción ya aplicada y volver a cobrar precio de lista) — actualiza de inmediato el
`monto_base` de la cuota **adeudada** (la única cuota abierta de esa inscripción, ver
más abajo) para reflejar el nuevo precio. Nunca se toca una cuota ya `pagada` — el
histórico de lo cobrado no se reescribe. Un cambio de precio de lista de un plan solo
afecta a los alumnos que pagan ese precio de lista (`inscripcion.precio_acordado is
null`); los que tienen un precio acordado/promocional no se mueven por eso. Mecanismo
compartido: `actualizarCuotasAdeudadasDeInscripciones` (`src/app/cuotas/actions.ts`),
llamado tanto desde `src/app/planes/actions.ts` como desde
`actualizarPrecioInscripcion` en `src/app/alumnos/actions.ts`.

---

## 3.5. Módulo de Rutinas (implementado, `0007_rutinas.sql`)

Una **rutina** es una plantilla reutilizable (no atada a un alumno desde el vamos): el
profesor la arma una vez y después la **asigna** a uno o varios alumnos con su propia
fecha de inicio. Jerarquía fija:

```
rutina (plantilla)
  -> rutina_semana (1 a 4, se crean las 4 automáticamente al crear la rutina)
    -> rutina_dia (N por semana, elegidos por el profesor, slots genéricos: Día 1, Día 2...)
      -> rutina_actividad (tipo: calentamiento | musculacion | recuperacion)
        -> rutina_ejercicio (ejercicio + intensidad/series/repeticiones/duración)
```

**Decisión de modelado clave: el músculo NO se guarda en la actividad.** Solo vive en
`ejercicio.musculo_id`. En el flujo del profesor, el músculo es un filtro para elegir
el ejercicio (elegís músculo → te muestra sus ejercicios → elegís uno), no un dato de
la actividad — así una actividad de "Musculación" puede tener ejercicios de varios
músculos sin conflicto (ej. pecho + hombros el mismo día).

**Catálogo base:** `musculo` (simple, igual forma que `disciplina`) y `ejercicio`
(pertenece a un músculo, `on delete restrict` — no se puede borrar del catálogo si está
usado en alguna rutina, mismo criterio que "un plan no se puede eliminar si está
asignado a un alumno").

**Asignación (`rutina_asignacion`):** una rutina puede asignarse a varios alumnos; un
alumno tiene como máximo una rutina `activa` a la vez (índice único parcial
`rutina_activa_unica_por_alumno`, mismo patrón que `precio_vigente_unico_por_plan`). Al
asignar una rutina nueva, cualquier asignación `activa` previa del alumno se cierra
automáticamente a `finalizada` — no hay una fecha de fin explícita, es historial simple.

**Fuera de alcance por ahora:** vista de la rutina desde la perspectiva del alumno (no
hay login de alumnos todavía), exportar/imprimir en PDF, marcar ejercicios como
"completados" (seguimiento de cumplimiento), y duplicar una semana dentro del builder.

---

## 4. Diseño original de prorrateo (no implementado, referencia histórica)

> **Superado por la sección 3.** Esta era la propuesta inicial (ciclo por mes
> calendario, con prorrateo en altas/bajas a mitad de mes) antes de que el profesor
> principal confirmara el ciclo por aniversario sin prorrateo. Se deja documentada por
> si en el futuro el gimnasio prefiere volver a un ciclo calendario — el cambio de plan
> con dos cuotas prorrateadas en particular seguía sin implementarse de todos modos
> (ver "Fuera de alcance" de la sección 3).

Regla original: **prorrateo por días calendario del mes**.

```
monto_final = round( (monto_base / dias_del_mes) * dias_facturados , 2 )
```

- `dias_del_mes`: cantidad de días del mes calendario en el que se genera la cuota.
- `dias_facturados`: desde `fecha_inicio` de la inscripción (inclusive) hasta el fin de
  ese mes calendario (inclusive).
- Se aplicaría solo en el primer período de cada inscripción y en el último si hay baja
  a mitad de mes. Los meses completos intermedios facturarían `monto_base` sin
  prorrateo.

**Cambio de plan a mitad de mes** (tampoco implementado, sigue fuera de alcance): se
generarían dos cuotas prorrateadas, una por cada plan, cerrando la inscripción vigente
(`fecha_fin = día_del_cambio - 1`) y abriendo una nueva (`fecha_inicio = día_del_cambio`).

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
