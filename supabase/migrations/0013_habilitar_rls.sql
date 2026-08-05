-- =========================================================
-- Migración 0013: Habilitar Row Level Security en todas las tablas
-- Centro RM
--
-- Sin policies a propósito: todo el negocio pasa por Server Actions con la
-- service role key (createServerClient en src/lib/supabase/server.ts), que
-- ignora RLS. El único cliente que usa la anon key (createSessionClient en
-- src/lib/supabase/session.ts) solo habla con Supabase Auth, nunca consulta
-- estas tablas directamente. Bloquear todo por defecto evita que la anon
-- key -pública, embebida en el JS del navegador- pueda leer o escribir
-- datos directo vía la REST API de Supabase, sin pasar por la app.
-- =========================================================

alter table alumno enable row level security;
alter table configuracion_pagos enable row level security;
alter table cuota enable row level security;
alter table disciplina enable row level security;
alter table ejercicio enable row level security;
alter table inscripcion enable row level security;
alter table musculo enable row level security;
alter table pago enable row level security;
alter table plan enable row level security;
alter table plan_precio_historico enable row level security;
alter table profesor enable row level security;
alter table profesor_disciplina enable row level security;
alter table promocion enable row level security;
alter table promocion_plan enable row level security;
alter table rutina enable row level security;
alter table rutina_actividad enable row level security;
alter table rutina_asignacion enable row level security;
alter table rutina_dia enable row level security;
alter table rutina_ejercicio enable row level security;
alter table rutina_semana enable row level security;
alter table turno enable row level security;
alter table usuario enable row level security;
