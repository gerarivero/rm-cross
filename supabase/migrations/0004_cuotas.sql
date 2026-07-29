-- =========================================================
-- Migración 0004: Cuotas, pagos y configuración de vencimientos
-- Centro RM — ver docs/modelo_datos.md
--
-- Ciclo por aniversario (definido en esta vuelta, no por mes calendario):
-- cada cuota cubre 1 mes exacto desde fecha_inicio de la inscripción. Vence
-- al cumplirse el mes; hay `dias_gracia` de gracia después del vencimiento
-- antes de considerarse vencida. Sin prorrateo: siempre se cobra el monto
-- completo (precio de lista o precio_acordado de la inscripción).
-- =========================================================

create table configuracion_pagos (
  id              uuid primary key default gen_random_uuid(),
  dias_gracia     smallint not null default 10,
  tipo_recargo    text not null default 'porcentaje' check (tipo_recargo in ('porcentaje', 'monto_fijo')),
  valor_recargo   numeric(12,2) not null default 10,
  actualizado_en  timestamptz not null default now()
);

insert into configuracion_pagos (dias_gracia, tipo_recargo, valor_recargo)
values (10, 'porcentaje', 10);

create type estado_cuota as enum ('adeudada', 'pagada', 'vencida', 'anulada');

-- 'vencida' y el recargo real de cada cuota se calculan al vuelo (sin cron todavía,
-- ver src/app/cuotas/estado.ts) — acá 'estado' arranca y queda en 'adeudada' hasta
-- que se registra un pago, momento en el que pasa a 'pagada' y recargo_aplicado
-- queda fijo con lo que correspondía cobrar ese día.
create table cuota (
  id                  uuid primary key default gen_random_uuid(),
  inscripcion_id      uuid not null references inscripcion(id),
  periodo_desde       date not null,
  periodo_hasta       date not null,
  fecha_vencimiento   date not null,
  monto_base          numeric(12,2) not null check (monto_base > 0),
  recargo_aplicado    numeric(12,2) not null default 0,
  estado              estado_cuota not null default 'adeudada',
  creado_en           timestamptz not null default now(),
  unique (inscripcion_id, periodo_desde)
);

create index cuota_inscripcion_id_idx on cuota (inscripcion_id);

create table pago (
  id              uuid primary key default gen_random_uuid(),
  cuota_id        uuid not null references cuota(id),
  monto           numeric(12,2) not null,
  fecha_pago      timestamptz not null default now(),
  medio           text not null check (medio in ('efectivo', 'transferencia', 'mercadopago', 'tarjeta')),
  referencia      text,
  registrado_por  uuid references usuario(id)
);

create index pago_cuota_id_idx on pago (cuota_id);
