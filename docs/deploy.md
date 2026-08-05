# Manual de despliegue — Centro RM

Este documento explica cómo desplegar (y, si hace falta, recrear desde cero) el
ambiente de producción de Centro RM en DigitalOcean.

## 1. Arquitectura

```
GitHub (push a master)
      │
      ▼
GitHub Actions (.github/workflows/deploy.yml)
   1. npm ci / lint / typecheck
   2. npm run build          (Next.js output: "standalone")
   3. empaqueta .next/standalone + .next/static + public
      │  scp + ssh (clave DEPLOY_SSH_KEY)
      ▼
Droplet DigitalOcean ($6/mes — s-1vcpu-1gb, Ubuntu 22.04)
   /var/www/centro-rm/
     releases/<timestamp>/   ← cada deploy es una carpeta nueva
     current -> releases/... ← symlink que apunta al release activo
     shared/.env.production  ← secretos de servidor (no se pisan en el deploy)
   systemd (centro-rm.service) corre `node current/server.js` en 127.0.0.1:3000
   Nginx hace de reverse proxy en :80/:443 (TLS con Let's Encrypt/Certbot)
      │
      ▼
   rm.iteasy.com.ar
      │
      ▼
Supabase (Postgres + Auth + Storage) — externo, no vive en el droplet
```

El droplet es **descartable**: no guarda ningún dato de negocio (todo vive en
Supabase), así que se puede destruir y recrear sin pérdida de información. El
build corre en GitHub Actions (no en el droplet) porque con 1GB de RAM
`npm run build` es riesgoso; al droplet solo se le copia el artefacto ya
compilado.

## 2. Prerequisitos

- Cuenta de DigitalOcean con el dominio `iteasy.com.ar` delegado a los
  nameservers de DO (DNS gestionado ahí).
- Token de API de DigitalOcean (Settings → API en el panel de DO).
- `doctl` instalado localmente:
  - macOS: `brew install doctl`
  - Windows: `choco install doctl` o descargar el binario desde
    [github.com/digitalocean/doctl/releases](https://github.com/digitalocean/doctl/releases)
  - Linux: `snap install doctl`
- Autenticar `doctl`:
  ```bash
  doctl auth init
  ```
  (pide el token de API generado arriba).
- Acceso de admin al repo de GitHub (`gerarivero/rm-cross`) para cargar
  Secrets y ver Actions.

## 3. Generar la clave SSH de deploy

Esta clave es exclusiva para el pipeline de deploy — no es la clave SSH
personal de nadie. La privada nunca se commitea (ver `.gitignore`: patrones
`*.pem`, `*deploy-key*`, `id_ed25519*`, `id_rsa*` están excluidos como
salvaguarda).

```bash
ssh-keygen -t ed25519 -C "deploy-centro-rm" -f ~/.ssh/centro-rm-deploy-key -N ""
```

Esto genera `~/.ssh/centro-rm-deploy-key` (privada) y
`~/.ssh/centro-rm-deploy-key.pub` (pública). Guardá la privada en un lugar
seguro (gestor de contraseñas) — se necesita para cargarla como GitHub Secret
en el paso 7 y para conectarte a mano si hace falta.

## 4. Crear el droplet

```bash
DEPLOY_PUBLIC_KEY_PATH=~/.ssh/centro-rm-deploy-key.pub ./infra/create-droplet.sh
```

Qué hace:
- Sube la clave pública de deploy a DigitalOcean (si no está ya).
- Renderiza `infra/cloud-init.yaml` (inyecta la clave pública, la unit de
  systemd de `infra/centro-rm.service` y el config de Nginx de
  `infra/nginx.conf.tmpl`).
- Crea el droplet `centro-rm` (región `nyc3`, tamaño `s-1vcpu-1gb`, Ubuntu
  22.04), taggeado `centro-rm`. Cloud-init instala Node 20, Nginx, Certbot,
  UFW, crea el usuario `deploy`, la estructura de `releases/`, habilita el
  servicio `centro-rm` (todavía no arrancado — no hay ningún release) y
  levanta el firewall (solo SSH + HTTP/HTTPS).
- Crea o actualiza el registro DNS A de `rm.iteasy.com.ar` apuntando a la IP
  del droplet nuevo.

Al terminar imprime la IP y los próximos pasos (los mismos que las secciones
5 a 7 de este documento).

DNS puede tardar unos minutos en propagar. Se puede chequear con:

```bash
dig +short rm.iteasy.com.ar
```

## 5. Emitir el certificado TLS (una vez por droplet)

No se automatiza en cloud-init porque Certbot necesita que el DNS ya
resuelva al droplet (si se corre antes, falla la validación HTTP-01).

```bash
ssh -i ~/.ssh/centro-rm-deploy-key deploy@rm.iteasy.com.ar
sudo certbot --nginx -d rm.iteasy.com.ar
```

Certbot edita el server block de Nginx (`/etc/nginx/sites-available/centro-rm`)
para agregar el bloque `:443` y el redirect HTTP→HTTPS, y configura la
renovación automática (systemd timer `certbot.timer`, ya viene con el paquete).

## 6. Configurar `.env.production` en el droplet

Las variables server-only (nunca pasan por GitHub Actions ni se commitean):

```bash
scp -i ~/.ssh/centro-rm-deploy-key .env.production deploy@rm.iteasy.com.ar:/var/www/centro-rm/shared/.env.production
```

Contenido de `.env.production` (mismas claves que `.env.example`, valores de
producción del proyecto Supabase):

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Este archivo vive en `shared/`, fuera del árbol de `releases/`, así que un
deploy nuevo nunca lo pisa.

## 7. Cargar los GitHub Secrets

En el repo: **Settings → Secrets and variables → Actions**:

| Secret | Valor |
|---|---|
| `DEPLOY_SSH_KEY` | Contenido de `~/.ssh/centro-rm-deploy-key` (la privada, completa) |
| `DEPLOY_HOST` | `rm.iteasy.com.ar` |
| `DEPLOY_USER` | `deploy` |
| `NEXT_PUBLIC_SUPABASE_URL` | Igual que en `.env.production` (se inlinea en build) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Igual que en `.env.production` |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` **no** van acá — son server-only y
ya quedaron en `.env.production` en el droplet (paso 6).

## 8. Crear el primer usuario administrador

Crear un administrador desde la UI (**Configuración → Administradores**)
requiere estar logueado como administrador — y un sistema recién instalado no
tiene ninguno con credenciales reales (la migración `0002` siembra una fila
`usuario` placeholder, `admin@centrorm.local`, sin `auth_user_id`, que nunca
pudo loguearse). Para romper ese círculo hay un script que habla directo con
Supabase con la service role key:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  npm run seed:admin -- --nombre "Nombre Apellido" --email vos@dominio.com --password "unaClaveSegura123"
```

Usá las mismas `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` del proyecto
(local: `.env.local`; producción: `/var/www/centro-rm/shared/.env.production`
en el droplet, o directo desde tu máquina si el proyecto de Supabase es
accesible). El script:

1. Crea el usuario en Supabase Auth con la contraseña indicada.
2. Crea su fila en `usuario` con `es_admin = true`.
3. Si todavía existe el placeholder `admin@centrorm.local` (sin
   `auth_user_id`), lo borra.

Después de correrlo, entrá a `/login` con ese email y contraseña. Desde ahí
ya podés crear el resto de los administradores por la UI normal, y cambiar tu
propia contraseña desde Mi Cuenta si querés.

## 9. Deploy automático

Cualquier push a `master` dispara `.github/workflows/deploy.yml`:

1. `npm ci`, `lint`, `typecheck`, `build` (con `output: "standalone"`).
2. Empaqueta el build en un tarball y lo sube al droplet vía `scp`.
3. Por SSH: lo extrae en `releases/<timestamp>-<sha>/`, actualiza el symlink
   `current`, reinicia `centro-rm.service`, verifica que quedó activo, y
   borra releases viejos (deja las últimas 3).

Ver progreso en la pestaña **Actions** del repo. Logs del servicio en el
droplet:

```bash
ssh -i ~/.ssh/centro-rm-deploy-key deploy@rm.iteasy.com.ar
sudo journalctl -u centro-rm -f
```

## 10. Deploy manual / rollback

- **Re-disparar el deploy actual**: pestaña Actions → workflow "Deploy" → *Run workflow*.
- **Rollback a un release anterior** (sin pasar por CI):
  ```bash
  ssh -i ~/.ssh/centro-rm-deploy-key deploy@rm.iteasy.com.ar
  ls /var/www/centro-rm/releases          # ver releases disponibles
  ln -sfn /var/www/centro-rm/releases/<timestamp-anterior> /var/www/centro-rm/current
  sudo systemctl restart centro-rm
  ```

## 11. Destruir el droplet

```bash
./infra/destroy-droplet.sh
```

Borra el droplet y el registro DNS A de `rm.iteasy.com.ar`. No se pierde
ningún dato (todo vive en Supabase). Para recrear el ambiente: repetir desde
el paso 4. Si se mantiene el mismo dominio como `DEPLOY_HOST`, no hace falta
tocar los GitHub Secrets — apenas el DNS vuelva a propagar, el próximo deploy
funciona igual. Sí hay que repetir el paso 5 (certbot) porque el certificado
vivía en el droplet anterior.

## 12. Costos

- Droplet `s-1vcpu-1gb`: **US$6/mes**.
- DNS y certificado TLS (Let's Encrypt vía DO): sin costo adicional.

## 13. Troubleshooting

- **`certbot` falla con error de validación HTTP-01**: el DNS todavía no
  propagó, o el puerto 80 no está abierto. Verificar `dig +short
  rm.iteasy.com.ar` apunta a la IP correcta, y `sudo ufw status`.
- **El servicio no arranca tras un deploy**
  (`systemctl is-active` falla en el workflow): revisar
  `sudo journalctl -u centro-rm -n 50`. La causa más común es una variable
  faltante en `/var/www/centro-rm/shared/.env.production`.
- **El workflow falla en el paso de SSH/SCP**: confirmar que `DEPLOY_HOST`
  resuelve, que el usuario `deploy` existe en el droplet (lo crea
  cloud-init) y que la clave pública subida coincide con la privada cargada
  en `DEPLOY_SSH_KEY`.
- **Nginx devuelve 502**: el servicio `centro-rm` no está corriendo o no
  está escuchando en el puerto 3000. `sudo systemctl status centro-rm`.
