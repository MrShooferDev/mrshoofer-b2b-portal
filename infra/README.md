# Shoofer platform — Docker Compose (new VPS)

One Compose project runs the platform-critical stack behind nginx on **:80** and **:8080** (Arvan TLS termination stays the same).

## Services

| Compose service | Public host(s) | Notes |
|-----------------|----------------|--------|
| `postgres` | — (127.0.0.1:5432 on host) | Named volume `shoofer_pgdata` |
| `nginx` | all public hosts | Edge reverse proxy |
| `ors` | `ors.shoofer.taxi`, `mrbilit.shoofer.taxi` | Memory reservation; keep alive |
| `agency` | `agency.shoofer.taxi` | Built from this repo’s `Dockerfile` |
| `org` | `mrshoofer.com`, `pay.mrshoofer.ir` | Sale app |
| `driver` | (API via nginx if needed) | Driver API |
| `marketing` | `shoofer.taxi` | Next.js landing |
| `apidocs` / `docs` / `driver-web` | matching `*.shoofer.taxi` | Static nginx |
| `uptime-kuma` | `127.0.0.1:3001` only | Capped ~256MB |

**Not in this file (on purpose):** mailserver, chatbot (PM2). Add later if you want them on the same box.

## Layout

```text
infra/
  docker-compose.yml
  .env.example / .env.marketing.example
  nginx/                 # edge config
  services/{ors,org,driver}/Dockerfile + publish/ (synced, gitignored)
  static/{apidocs,docs,driver-web}/
  backups/               # put pg dumps here
```

## Latest source pins (as of last setup)

| App | Repo | Ref used | How image is built |
|-----|------|----------|--------------------|
| ORS | `MrShoofer-ORS` | live publish from 89.42 (`origin/feature/ors-api-v2` **does not compile** — missing Comms types) | `infra/services/ors` publish wrap |
| Agency | `MrShoofer-enterprise-selling` | `origin/main` (`6a4c9c5`) | `dotnet publish -r linux-x64` → publish wrap |
| Sale/ORG | `ORG` | local `main` (`cd3e8c6`, ahead of origin) | same |
| Marketing | `shoofer-agency-landing` | `origin/editor-mode` (`f7f56d4`) | repo `Dockerfile` |
| Driver | (no git repo wired) | live publish from 89.42 | `infra/services/driver` publish wrap |

Secrets go in `infra/.env` + `infra/.env.marketing` (gitignored):
`ConnectionStrings__PostgreSQL` / `__production` / `__DefaultConnection`, SMS keys, PostHog/reCAPTCHA.

Checkout helper: `./scripts/checkout-latest.sh`

## Bootstrap order (safe)

1. **Prepare secrets**
   ```bash
   cd infra
   cp .env.example .env
   cp .env.marketing.example .env.marketing
   # edit passwords + connection strings + marketing secrets
   ```

2. **Dump Postgres on the live DB host (89.42) while it is healthy**
   ```bash
   sudo -u postgres pg_dumpall -f /root/shoofer-pg-full.sql
   # scp to new VPS → infra/backups/shoofer-pg-full.sql
   ```

3. **Sync app binaries + static sites** (from old VPSes)
   ```bash
   # ORS
   rsync -az root@89.42.199.39:/root/ORS/publish/ services/ors/publish/
   # Agency can build from source (compose uses ../Dockerfile) OR sync publish
   # Sale / org
   rsync -az root@62.60.191.21:/var/www/org/ services/org/publish/
   # Driver
   rsync -az root@89.42.199.39:/opt/mrshoofer-driver/ services/driver/publish/
   # Static
   rsync -az root@89.42.199.39:/var/www/apidocs-portal/ static/apidocs/
   rsync -az root@89.42.199.39:/var/www/docs-portal/ static/docs/
   rsync -az root@89.42.199.39:/var/www/driver.shoofer.taxi/ static/driver-web/
   ```
   Adjust remote paths if `ENTRYPOINT` / DLL names differ after you inspect the publish folders.

4. **Start Postgres only, restore, then the rest**
   ```bash
   docker compose up -d postgres
   # wait until healthy
   docker compose exec -T postgres psql -U postgres < backups/shoofer-pg-full.sql
   docker compose up -d --build
   docker compose ps
   ```

5. **Smoke locally on the new VPS**
   ```bash
   curl -H 'Host: mrshoofer.com' http://127.0.0.1/
   curl -H 'Host: agency.shoofer.taxi' http://127.0.0.1/Auth/Login
   curl -H 'Host: ors.shoofer.taxi' http://127.0.0.1/health
   curl -H 'Host: shoofer.taxi' http://127.0.0.1/robots.txt
   ```

6. **Point Arvan origin** to the new VPS IP only after step 5 is green. Keep old boxes until you are sure.

## ORS protection

- `mem_reservation: 512m` + higher `mem_limit`
- `oom_score_adj: -500` (less likely to be OOM-killed than Kuma)

## Notes / gaps to fill when you give the new server

1. Confirm exact **DLL names** and folder layouts for `org` and `driver` after rsync.
2. Confirm real **database names** per app (may not all be `ORG`).
3. Port live **nginx** quirks from 89.42 / 62.60 into `nginx/conf.d/` if a host behaves differently.
4. Marketing build needs the landing repo path (`MARKETING_CONTEXT`) or a pre-built `shoofer-marketing:latest` image load.
5. A **2 CPU / 6 GB** box is tight for this full stack — keep Kuma capped; consider skipping mail/chatbot on the same machine.

## Commands cheat sheet

```bash
docker compose ps
docker compose logs -f org ors agency
docker compose restart org
docker compose up -d --build agency
# NEVER in prod unless you mean it:
# docker compose down -v   # destroys Postgres volume
```
