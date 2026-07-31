-- =========================================================
-- Migración 0010: Módulo de Configuración — activo en turno
-- Centro RM — ver docs/modelo_datos.md
--
-- Permite dar de baja un turno sin romper el historial de alumnos que ya lo
-- tienen asignado (mismo criterio que plan.activo / disciplina.activo /
-- musculo.activo).
-- =========================================================

alter table turno add column activo boolean not null default true;
