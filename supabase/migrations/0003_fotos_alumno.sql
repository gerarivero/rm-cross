-- =========================================================
-- Migración 0003: Fotos de progreso del alumno (antes/actual)
-- Centro RM — ver docs/modelo_datos.md
-- =========================================================

alter table alumno
  add column foto_inicial_url text,
  add column foto_actual_url text;

-- Bucket público para las fotos de progreso. Público porque son solo fotos de
-- comparación física (no documentación sensible tipo DNI), y así el <img src>
-- puede apuntar directo a la URL sin manejar tokens firmados. Las subidas pasan
-- siempre por las Server Actions con la service role key, así que no hace falta
-- una policy de INSERT sobre storage.objects (la service role bypassea RLS).
insert into storage.buckets (id, name, public)
values ('alumnos-fotos', 'alumnos-fotos', true)
on conflict (id) do nothing;
