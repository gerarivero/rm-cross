-- =========================================================
-- Migración 0002: Alumnos (datos completos) + Promociones por plan
-- Centro RM — ver docs/modelo_datos.md para el modelo completo
-- =========================================================

-- ---------------------------------------------------------
-- Turnos (catálogo, sin UI de administración todavía — mismo
-- tratamiento que 'disciplina': se siembra por migración).
-- ---------------------------------------------------------

create table turno (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  hora_inicio   time not null,
  hora_fin      time not null
);

insert into turno (nombre, hora_inicio, hora_fin) values
  ('Mañana', '07:00', '12:00'),
  ('Tarde', '12:00', '18:00'),
  ('Noche', '18:00', '23:00');

-- ---------------------------------------------------------
-- Alumno: datos completos. DNI es el único campo obligatorio,
-- por eso nombre/apellido dejan de ser NOT NULL.
-- ---------------------------------------------------------

alter table alumno
  add column dni text not null unique,
  add column fecha_nacimiento date,
  add column celular text,
  add column turno_id uuid references turno(id),
  add column altura numeric(5,2),
  add column peso numeric(5,2);

alter table alumno
  alter column nombre drop not null,
  alter column apellido drop not null;

-- ---------------------------------------------------------
-- Promoción <-> Plan (muchos a muchos): una promoción puede
-- aplicar a varios planes.
-- ---------------------------------------------------------

create table promocion_plan (
  promocion_id  uuid not null references promocion(id) on delete cascade,
  plan_id       uuid not null references plan(id) on delete cascade,
  primary key (promocion_id, plan_id)
);

-- ---------------------------------------------------------
-- Usuario admin sembrado: todavía no hay login/auth real, así que
-- no hay forma de saber qué profesor está autorizando un precio
-- promocional (inscripcion.autorizado_por). Hasta que exista
-- autenticación, las Server Actions usan este usuario como
-- autorizador por defecto (buscándolo por es_admin = true).
-- ---------------------------------------------------------

insert into usuario (email, nombre, tipo, es_admin)
values ('admin@centrorm.local', 'Profesor Principal', 'profesor', true)
on conflict (email) do nothing;
