-- =========================================================
-- Migración 0007: Módulo de Rutinas (plantillas de 4 semanas + asignación)
-- Centro RM — ver docs/modelo_datos.md
--
-- Jerarquía: rutina (plantilla) -> rutina_semana (1..4, fijas) -> rutina_dia
-- (N por semana, slots genéricos) -> rutina_actividad (calentamiento /
-- musculacion / recuperacion) -> rutina_ejercicio (ejercicio + intensidad /
-- series / repeticiones / duración).
--
-- El músculo NO se guarda en la actividad: solo en ejercicio.musculo_id. El
-- músculo es un filtro para elegir el ejercicio, no un dato de la actividad
-- (una actividad de "Musculación" puede tener ejercicios de varios músculos).
-- =========================================================

-- ---------------------------------------------------------
-- Catálogo: músculos y ejercicios
-- ---------------------------------------------------------

create table musculo (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  descripcion   text,
  activo        boolean not null default true
);

create table ejercicio (
  id            uuid primary key default gen_random_uuid(),
  musculo_id    uuid not null references musculo(id) on delete restrict,
  nombre        text not null,
  descripcion   text,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

create index ejercicio_musculo_id_idx on ejercicio (musculo_id);

-- ---------------------------------------------------------
-- Rutina (plantilla) y su estructura de 4 semanas
-- ---------------------------------------------------------

create table rutina (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  descripcion   text,
  activo        boolean not null default true,
  creado_por    uuid references usuario(id),
  creado_en     timestamptz not null default now()
);

create table rutina_semana (
  id              uuid primary key default gen_random_uuid(),
  rutina_id       uuid not null references rutina(id) on delete cascade,
  numero_semana   smallint not null check (numero_semana between 1 and 4),
  unique (rutina_id, numero_semana)
);

create table rutina_dia (
  id            uuid primary key default gen_random_uuid(),
  semana_id     uuid not null references rutina_semana(id) on delete cascade,
  numero_dia    smallint not null check (numero_dia between 1 and 7),
  unique (semana_id, numero_dia)
);

create type tipo_actividad as enum ('calentamiento', 'musculacion', 'recuperacion');

create table rutina_actividad (
  id            uuid primary key default gen_random_uuid(),
  dia_id        uuid not null references rutina_dia(id) on delete cascade,
  tipo          tipo_actividad not null,
  orden         smallint not null default 0
);

create index rutina_actividad_dia_id_idx on rutina_actividad (dia_id);

create type tipo_intensidad as enum ('baja', 'media', 'alta');

create table rutina_ejercicio (
  id                  uuid primary key default gen_random_uuid(),
  actividad_id        uuid not null references rutina_actividad(id) on delete cascade,
  -- restrict: un ejercicio no se puede borrar del catálogo mientras esté
  -- usado en alguna rutina (mismo criterio que "un plan no se puede eliminar
  -- si está asignado a un alumno").
  ejercicio_id        uuid not null references ejercicio(id) on delete restrict,
  orden               smallint not null default 0,
  intensidad          tipo_intensidad,
  series              smallint,
  repeticiones        smallint,
  duracion_minutos    smallint,
  notas               text
);

create index rutina_ejercicio_actividad_id_idx on rutina_ejercicio (actividad_id);
create index rutina_ejercicio_ejercicio_id_idx on rutina_ejercicio (ejercicio_id);

-- ---------------------------------------------------------
-- Asignación de una rutina a un alumno (una rutina puede asignarse a varios
-- alumnos; un alumno tiene como máximo una rutina activa a la vez).
-- ---------------------------------------------------------

create table rutina_asignacion (
  id              uuid primary key default gen_random_uuid(),
  -- restrict: no se puede borrar una rutina mientras tenga asignaciones.
  rutina_id       uuid not null references rutina(id) on delete restrict,
  alumno_id       uuid not null references alumno(id) on delete cascade,
  fecha_inicio    date not null,
  estado          text not null default 'activa' check (estado in ('activa', 'finalizada')),
  creado_en       timestamptz not null default now()
);

create index rutina_asignacion_alumno_id_idx on rutina_asignacion (alumno_id);

-- Mismo patrón que precio_vigente_unico_por_plan: un único índice parcial
-- garantiza que un alumno no tenga dos rutinas "activa" al mismo tiempo.
create unique index rutina_activa_unica_por_alumno
  on rutina_asignacion (alumno_id)
  where estado = 'activa';
