#!/usr/bin/env bash
# Crea (o recrea) el droplet de Centro RM en DigitalOcean, listo para recibir
# deploys del workflow de GitHub Actions.
#
# Requiere: doctl autenticado (`doctl auth init`) y estas variables de entorno:
#   DEPLOY_PUBLIC_KEY_PATH   ruta a la clave pública de deploy (ver docs/deploy.md, paso 3)
#
# Uso:
#   DEPLOY_PUBLIC_KEY_PATH=~/.ssh/centro-rm-deploy-key.pub ./infra/create-droplet.sh
#
# Ver docs/deploy.md para el procedimiento completo (incluye qué hacer después
# de correr este script: certbot, .env.production, GitHub Secrets).

set -euo pipefail

DROPLET_NAME="centro-rm"
DROPLET_TAG="centro-rm"
REGION="nyc3"
SIZE="s-1vcpu-1gb"
IMAGE="ubuntu-22-04-x64"
DOMAIN="rm.iteasy.com.ar"
ROOT_DOMAIN="iteasy.com.ar"

: "${DEPLOY_PUBLIC_KEY_PATH:?Definí DEPLOY_PUBLIC_KEY_PATH con la ruta a la clave pública de deploy}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

command -v doctl >/dev/null || { echo "doctl no está instalado. Ver docs/deploy.md, paso 2." >&2; exit 1; }
doctl account get >/dev/null || { echo "doctl no está autenticado. Corré: doctl auth init" >&2; exit 1; }

if doctl compute droplet list --tag-name "$DROPLET_TAG" --format Name --no-header | grep -q .; then
  echo "Ya existe un droplet con el tag '$DROPLET_TAG'. Destruilo primero con infra/destroy-droplet.sh si querés recrearlo." >&2
  exit 1
fi

echo "==> Importando/verificando la clave SSH de deploy en DigitalOcean"
DEPLOY_PUBLIC_KEY="$(cat "$DEPLOY_PUBLIC_KEY_PATH")"
KEY_NAME="centro-rm-deploy"
if ! doctl compute ssh-key list --format Name --no-header | grep -qx "$KEY_NAME"; then
  doctl compute ssh-key import "$KEY_NAME" --public-key-file "$DEPLOY_PUBLIC_KEY_PATH"
fi
SSH_KEY_FINGERPRINT="$(doctl compute ssh-key list --format Name,FingerPrint --no-header | awk -v n="$KEY_NAME" '$1==n{print $2}')"

echo "==> Renderizando cloud-init.yaml"
RENDERED_CLOUD_INIT="$WORKDIR/cloud-init.yaml"
python3 - "$SCRIPT_DIR" "$DOMAIN" "$DEPLOY_PUBLIC_KEY" "$RENDERED_CLOUD_INIT" <<'PYEOF'
import sys, pathlib

script_dir, domain, deploy_key, out_path = sys.argv[1:5]
script_dir = pathlib.Path(script_dir)

cloud_init = (script_dir / "cloud-init.yaml").read_text()
service = (script_dir / "centro-rm.service").read_text()
nginx_conf = (script_dir / "nginx.conf.tmpl").read_text().replace("__DOMAIN__", domain)

def indent(text, spaces):
    pad = " " * spaces
    return "\n".join(pad + line if line else line for line in text.splitlines())

cloud_init = cloud_init.replace("__DEPLOY_PUBLIC_KEY__", deploy_key.strip())

# Reemplazo línea por línea (preservando indentación) para los bloques embebidos.
lines = cloud_init.splitlines()
result = []
for line in lines:
    stripped = line.strip()
    if stripped == "__CENTRO_RM_SERVICE__":
        indent_str = line[: len(line) - len(line.lstrip(" "))]
        result.append(indent(service, len(indent_str)))
    elif stripped == "__NGINX_CONF__":
        indent_str = line[: len(line) - len(line.lstrip(" "))]
        result.append(indent(nginx_conf, len(indent_str)))
    else:
        result.append(line)

pathlib.Path(out_path).write_text("\n".join(result) + "\n")
PYEOF

echo "==> Creando droplet '$DROPLET_NAME' ($SIZE, $REGION)"
doctl compute droplet create "$DROPLET_NAME" \
  --region "$REGION" \
  --size "$SIZE" \
  --image "$IMAGE" \
  --tag-name "$DROPLET_TAG" \
  --ssh-keys "$SSH_KEY_FINGERPRINT" \
  --user-data-file "$RENDERED_CLOUD_INIT" \
  --wait

DROPLET_IP="$(doctl compute droplet list --tag-name "$DROPLET_TAG" --format PublicIPv4 --no-header)"
echo "==> Droplet creado con IP: $DROPLET_IP"

echo "==> Configurando DNS: A record $DOMAIN -> $DROPLET_IP"
SUBDOMAIN="${DOMAIN%.$ROOT_DOMAIN}"
EXISTING_RECORD_ID="$(doctl compute domain records list "$ROOT_DOMAIN" --format ID,Type,Name --no-header \
  | awk -v n="$SUBDOMAIN" '$2=="A" && $3==n {print $1}')"
if [ -n "$EXISTING_RECORD_ID" ]; then
  doctl compute domain records update "$ROOT_DOMAIN" --record-id "$EXISTING_RECORD_ID" --record-data "$DROPLET_IP"
else
  doctl compute domain records create "$ROOT_DOMAIN" --record-type A --record-name "$SUBDOMAIN" \
    --record-data "$DROPLET_IP" --record-ttl 300
fi

cat <<EOF

Droplet listo: $DROPLET_IP ($DOMAIN)

Próximos pasos (ver docs/deploy.md):
  1. Esperar a que el DNS propague (unos minutos): dig +short $DOMAIN
  2. SSH al droplet y emitir el certificado TLS:
       ssh -i <clave privada de deploy> deploy@$DOMAIN
       sudo certbot --nginx -d $DOMAIN
  3. Completar /var/www/centro-rm/shared/.env.production con las credenciales de Supabase.
  4. Cargar los GitHub Secrets (DEPLOY_SSH_KEY, DEPLOY_HOST=$DOMAIN, DEPLOY_USER=deploy, NEXT_PUBLIC_*).
  5. Correr el workflow "Deploy" (push a master o workflow_dispatch).
EOF
