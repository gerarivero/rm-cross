-- =========================================================
-- Migración 0006: Pagos parciales, saldo y comprobante de pago
-- Centro RM — ver docs/modelo_datos.md
--
-- El recargo por mora ahora se calcula sobre el saldo pendiente al momento
-- del vencimiento (no sobre monto_base completo), y una cuota puede tener
-- varios pagos parciales antes de quedar "pagada". Cuando queda totalmente
-- pagada se le asigna un número de comprobante correlativo.
-- =========================================================

create sequence comprobante_numero_seq start 1;

alter table cuota add column numero_comprobante bigint unique;

create or replace function asignar_numero_comprobante(p_cuota_id uuid)
returns bigint
language plpgsql
as $$
declare
  v_numero bigint;
begin
  update cuota
  set numero_comprobante = coalesce(numero_comprobante, nextval('comprobante_numero_seq')),
      estado = 'pagada'
  where id = p_cuota_id
  returning numero_comprobante into v_numero;

  return v_numero;
end;
$$;
