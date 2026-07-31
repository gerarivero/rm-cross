-- =========================================================
-- Migración 0008: fecha de fin en la asignación de rutina
-- Centro RM — ver docs/modelo_datos.md
--
-- Permite calcular (sin cron, al vuelo) si una asignación activa ya venció y
-- necesita revisión del profesor — mismo criterio que el resto del sistema.
-- =========================================================

alter table rutina_asignacion add column fecha_fin date;

alter table rutina_asignacion add constraint fecha_fin_posterior_a_inicio
  check (fecha_fin is null or fecha_fin >= fecha_inicio);
