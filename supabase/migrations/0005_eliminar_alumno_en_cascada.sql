-- =========================================================
-- Migración 0005: eliminar un alumno borra en cascada su historial
-- de inscripciones, cuotas y pagos. El plan NUNCA se toca (la FK de
-- inscripcion.plan_id sigue en ON DELETE RESTRICT, sin cambios).
--
-- Decisión de negocio (pedida explícitamente): a diferencia de Planes
-- (donde eliminar con alumnos asignados está bloqueado a propósito),
-- acá si se quiere borrar un alumno con plan asignado, se permite y
-- se lleva puesto su historial de cuotas/pagos. Los nombres de
-- constraint son los que Postgres genera por default para FKs
-- declaradas inline sin CONSTRAINT explícito: <tabla>_<columna>_fkey.
-- =========================================================

alter table inscripcion drop constraint inscripcion_alumno_id_fkey;
alter table inscripcion
  add constraint inscripcion_alumno_id_fkey
  foreign key (alumno_id) references alumno(id) on delete cascade;

alter table cuota drop constraint cuota_inscripcion_id_fkey;
alter table cuota
  add constraint cuota_inscripcion_id_fkey
  foreign key (inscripcion_id) references inscripcion(id) on delete cascade;

alter table pago drop constraint pago_cuota_id_fkey;
alter table pago
  add constraint pago_cuota_id_fkey
  foreign key (cuota_id) references cuota(id) on delete cascade;
