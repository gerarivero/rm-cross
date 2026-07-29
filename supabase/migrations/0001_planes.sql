-- =========================================================
-- Migración 0001: Módulo de Planes de Entrenamiento
-- Centro RM — ver docs/modelo_datos.md para el modelo completo
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Catálogo base
-- ---------------------------------------------------------

create table disciplina (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  descripcion   text,
  activo        boolean not null default true
);

-- ---------------------------------------------------------
-- Usuario mínimo (necesario para autorizado_por / auditoría de precios).
-- Se completa con el resto de los campos de personas en la próxima migración.
-- ---------------------------------------------------------

create type tipo_usuario as enum ('profesor', 'alumno');

create table usuario (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  nombre          text not null,
  tipo            tipo_usuario not null,
  es_admin        boolean not null default false,
  activo          boolean not null default true,
  creado_en       timestamptz not null default now(),
  constraint solo_profesor_puede_ser_admin
    check (not es_admin or tipo = 'profesor')
);

-- ---------------------------------------------------------
-- Planes y precios
-- ---------------------------------------------------------

create table plan (
  id                  uuid primary key default gen_random_uuid(),
  disciplina_id       uuid not null references disciplina(id),
  nombre              text not null,
  dias_por_semana     smallint,
  acceso_libre        boolean not null default false,
  descripcion         text,
  activo              boolean not null default true,
  creado_en           timestamptz not null default now(),
  constraint dias_por_semana_valido
    check (acceso_libre or (dias_por_semana between 1 and 7))
);

create table plan_precio_historico (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references plan(id) on delete cascade,
  precio          numeric(12,2) not null,
  vigente_desde   date not null,
  vigente_hasta   date,
  constraint precio_positivo check (precio > 0)
);

-- Un único índice parcial garantiza que no haya dos precios "vigentes" (sin
-- vigente_hasta) al mismo tiempo para el mismo plan.
create unique index precio_vigente_unico_por_plan
  on plan_precio_historico (plan_id)
  where vigente_hasta is null;

-- ---------------------------------------------------------
-- Promociones (catálogo simple, ver docs/modelo_datos.md)
-- ---------------------------------------------------------

create table promocion (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  descripcion     text,
  fecha_inicio    date,
  fecha_fin       date,
  activa          boolean not null default true
);

-- ---------------------------------------------------------
-- Alumno mínimo + Inscripción
-- ---------------------------------------------------------

create type estado_persona as enum ('activo', 'inactivo', 'de_baja', 'suspendido');

create table alumno (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid references usuario(id),
  nombre          text not null,
  apellido        text not null,
  email           text,
  estado          estado_persona not null default 'activo',
  fecha_alta      date not null default current_date
);

create type estado_inscripcion as enum ('activa', 'pausada', 'finalizada');

create table inscripcion (
  id                  uuid primary key default gen_random_uuid(),
  alumno_id           uuid not null references alumno(id),
  -- ON DELETE RESTRICT: la base impide borrar un plan mientras exista al menos
  -- una inscripción que lo referencie (activa, pausada o finalizada). Esta es
  -- la garantía dura del constraint pedido: "un plan no puede ser eliminado
  -- si está asignado a un alumno".
  plan_id             uuid not null references plan(id) on delete restrict,
  fecha_inicio        date not null,
  fecha_fin           date,
  estado              estado_inscripcion not null default 'activa',
  precio_acordado     numeric(12,2),
  promocion_id        uuid references promocion(id),
  autorizado_por      uuid references usuario(id),
  constraint precio_acordado_requiere_autorizacion
    check (precio_acordado is null or autorizado_por is not null)
);

create index inscripcion_plan_id_idx on inscripcion (plan_id);
create index inscripcion_alumno_id_idx on alumno (id);

-- ---------------------------------------------------------
-- Datos iniciales de ejemplo (disciplinas base)
-- ---------------------------------------------------------

insert into disciplina (nombre) values
  ('Musculación'), ('Spinning'), ('CrossFit'), ('GAP'), ('Funcional');
