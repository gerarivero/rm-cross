-- =========================================================
-- Migración 0011: Vínculo opcional usuario (login) <-> profesor (roster)
-- Centro RM — ver docs/modelo_datos.md
--
-- `profesor` (0009_profesores.sql) nació sin relación con `usuario` a propósito.
-- Ahora se agrega un vínculo opcional: qué profesor del roster es la persona
-- detrás de un login administrador. on delete set null: si se borra el profesor
-- del roster, el login no se pierde, solo se desvincula.
-- =========================================================

alter table usuario add column profesor_id uuid references profesor(id) on delete set null;
