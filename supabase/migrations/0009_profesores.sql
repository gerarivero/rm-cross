-- =========================================================
-- Migración 0009: Módulo de Profesores (roster + disciplinas que dicta)
-- Centro RM — ver docs/modelo_datos.md
--
-- Tabla propia, sin relación con `usuario` (que sigue siendo solo un actor
-- mínimo de auditoría/placeholder, ver 0001_planes.sql) ni con `rutina.creado_por`
-- — no hay auth real todavía, eso queda fuera de esta entrega.
-- =========================================================

create table profesor (
  id                uuid primary key default gen_random_uuid(),
  dni               text not null unique,
  nombre            text not null,
  apellido          text not null,
  email             text,
  celular           text,
  fecha_nacimiento  date,
  fecha_alta        date not null default current_date,
  activo            boolean not null default true,
  creado_en         timestamptz not null default now()
);

create table profesor_disciplina (
  profesor_id   uuid not null references profesor(id) on delete cascade,
  disciplina_id uuid not null references disciplina(id) on delete cascade,
  primary key (profesor_id, disciplina_id)
);
