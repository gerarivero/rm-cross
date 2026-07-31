-- =========================================================
-- Migración 0012: revertir vínculo usuario<->profesor, agregar auth_user_id
-- Centro RM — ver docs/modelo_datos.md
--
-- El vínculo con `profesor` (0011) no tenía ningún consumidor real en la app —
-- se revierte. En su lugar, `usuario` gana un vínculo explícito con la Auth user
-- de Supabase (hasta ahora se resolvía por email, que se vuelve editable en esta
-- misma entrega y ya no sirve como clave de matching).
-- =========================================================

alter table usuario drop column profesor_id;

alter table usuario add column auth_user_id uuid references auth.users(id) on delete cascade;
