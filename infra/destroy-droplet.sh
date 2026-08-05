#!/usr/bin/env bash
# Destruye el droplet de Centro RM. No se pierde ningún dato: la app es
# stateless y todo el estado vive en Supabase (externo al droplet).
#
# Uso:
#   ./infra/destroy-droplet.sh            # pide confirmación
#   ./infra/destroy-droplet.sh --yes      # sin confirmación (CI/automatización)

set -euo pipefail

DROPLET_TAG="centro-rm"
DOMAIN="rm.iteasy.com.ar"
ROOT_DOMAIN="iteasy.com.ar"

command -v doctl >/dev/null || { echo "doctl no está instalado." >&2; exit 1; }

DROPLETS="$(doctl compute droplet list --tag-name "$DROPLET_TAG" --format Name --no-header)"
if [ -z "$DROPLETS" ]; then
  echo "No hay ningún droplet con el tag '$DROPLET_TAG'. Nada que hacer."
  exit 0
fi

if [ "${1:-}" != "--yes" ]; then
  echo "Se va a destruir el droplet de Centro RM y el registro DNS de $DOMAIN."
  read -r -p "Confirmás? (escribí 'si' para continuar) " CONFIRM
  if [ "$CONFIRM" != "si" ]; then
    echo "Cancelado."
    exit 1
  fi
fi

echo "==> Destruyendo droplet(s) con tag '$DROPLET_TAG'"
doctl compute droplet delete --tag-name "$DROPLET_TAG" --force

SUBDOMAIN="${DOMAIN%.$ROOT_DOMAIN}"
RECORD_ID="$(doctl compute domain records list "$ROOT_DOMAIN" --format ID,Type,Name --no-header \
  | awk -v n="$SUBDOMAIN" '$2=="A" && $3==n {print $1}')"
if [ -n "$RECORD_ID" ]; then
  echo "==> Borrando registro DNS A de $DOMAIN"
  doctl compute domain records delete "$ROOT_DOMAIN" "$RECORD_ID" --force
fi

echo "Listo. Para volver a levantar el ambiente: infra/create-droplet.sh (ver docs/deploy.md)."
