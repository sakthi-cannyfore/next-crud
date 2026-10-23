# Users CRUD: complete setup and deployment guide

A simple application to create, list, edit, and delete users with **name, email, and role**.

| Part | Technology | Hosting |
| --- | --- | --- |
| Frontend | Next.js | Vercel |
| Backend | Express | Render |
| Database | PostgreSQL with TypeORM migrations | Supabase |

```text
Browser
  -> Vercel frontend
  -> Render Express API
  -> Supabase PostgreSQL
```

The `database` folder contains TypeORM configuration and migrations. It is built alongside the backend; it is not deployed as another web service. Your computer does not need to stay running after cloud deployment.

This starter has no authentication or authorization. Use disposable demo data until server-side access controls are added. CORS and the role field do not restrict who can call the API.

## Contents

1. [Your application addresses](#1-your-application-addresses)
2. [Check the repository and prerequisites](#2-check-the-repository-and-prerequisites)
3. [Create or select a Supabase project](#3-create-or-select-a-supabase-project)
4. [Prepare the database connection string](#4-prepare-the-database-connection-string)
5. [Get the database certificate](#5-get-the-database-certificate)
6. [Create the Render backend](#6-create-the-render-backend)
7. [Set Render environment variables and certificate](#7-set-render-environment-variables-and-certificate)
8. [Deploy Render and run migrations](#8-deploy-render-and-run-migrations)
9. [Deploy or configure the Vercel frontend](#9-deploy-or-configure-the-vercel-frontend)
10. [Connect CORS and verify the complete flow](#10-connect-cors-and-verify-the-complete-flow)
11. [View cloud users in Supabase or pgAdmin](#11-view-cloud-users-in-supabase-or-pgadmin)
12. [Run locally when needed](#12-run-locally-when-needed)
13. [Apply future changes and migrations](#13-apply-future-changes-and-migrations)
14. [Troubleshooting](#14-troubleshooting)
15. [Deployment checklist](#15-deployment-checklist)

## 1. Your application addresses

These are the addresses configured for this project. If you create a new service or project, replace them with its actual addresses.

| Purpose | Address |
| --- | --- |
| GitHub repository | https://github.com/sakthi-cannyfore/next-crud |
| Vercel frontend | https://next-crud-one-drab.vercel.app |
| Render backend host | https://next-crud-1-ld5m.onrender.com |
| API base URL | https://next-crud-1-ld5m.onrender.com/api |
| Users API | https://next-crud-1-ld5m.onrender.com/api/users |
| Database health check | https://next-crud-1-ld5m.onrender.com/health |

**Deployment order:** GitHub -> Supabase -> Render -> Vercel -> verify saved data.

Already have these deployments? Reuse them and update their settings instead of creating duplicates.

## 2. Check the repository and prerequisites

You need a GitHub account, a Supabase project, a Render account, and a Vercel account. Install Git and Node.js 22 if you will use the local commands. `.nvmrc` specifies Node 22 for this project.

### 2.1 Verify the top-level folders

Open the repository on GitHub and select the branch you will deploy, currently `main`. Its top level should contain:

```text
next-crud/
  frontend/
    app/
    lib/api.ts
    package.json
    .env.example
    .env.production.example
    .gitignore
  backend/
    src/server.ts
    package.json
    .env.example
    .env.production.example
    .gitignore
  database/
    src/data-source.ts
    src/entities/User.ts
    src/migrations/1792713600000-CreateUsers.ts
    package.json
    .env.example
    .env.production.example
    .gitignore
  package.json
  package-lock.json
  .gitignore
  .nvmrc
  README.md
```

The root `package.json`, beside the three folders, must contain:

```json
"workspaces": ["frontend", "backend", "database"]
```

Do not upload only `backend` to a separate repository. This backend imports the shared database workspace.

### 2.2 Open the correct local directory

In PowerShell:

```powershell
cd 'C:\Users\Sakthi\OneDrive - Cannyfore Technology Solutions Pvt Ltd\Desktop\nextjs-with-deployment'
node --version
npm --version
npm ci
npm pkg get name --workspaces
```

Expected workspace names: `@users/frontend`, `@users/backend`, and `@users/database`.

All local commands below start from this project root unless explicitly stated otherwise. `npm ci` uses the existing lockfile; after deliberately changing dependencies, use `npm install` and commit the updated lockfile.

### 2.3 Push source changes

Review your changes before committing:

```powershell
git status --short
git add .
git commit -m "Prepare application for deployment"
git push origin main
```

If Git says there is nothing to commit, continue. Root and per-project ignore files exclude real `.env` files, certificates, dependencies, build output, and local PostgreSQL storage. Keep `package-lock.json`, source migrations, and `.env.example` templates in Git. Never commit a real database password or URI containing one; an encoded password is still a password.

## 3. Create or select a Supabase project

1. Open [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your existing project, or create a new one.
3. For a new project, choose a name, region, and database password, then wait for provisioning to finish.
4. Keep the database password private. It is not your Supabase account password or an API key.
5. Open **Connect** and choose **Session pooler**.
6. Copy the PostgreSQL URI.

For this setup, use the session-pooler endpoint on port **5432**, not the transaction endpoint on 6543. Session mode supports IPv4 and this persistent Express connection. [Supabase connection documentation](https://supabase.com/docs/guides/database/connecting-to-postgres)

Your provided connection uses:

| Connection part | Value |
| --- | --- |
| Project reference | `quvogykwweidzfbfaiyw` |
| Username | `postgres.quvogykwweidzfbfaiyw` |
| Pooler host | `aws-0-ap-south-1.pooler.supabase.com` |
| Port | `5432` |
| Database | `postgres` |

Confirm these against your project's Connect dialog. For a different project, copy its own values.

**Supabase uses database `postgres` in this URI. Do not substitute the local database name `users_crud` unless you deliberately created and configured another cloud database.**

You do not need Supabase's JavaScript SDK, anon key, or service-role key for this Express/TypeORM implementation.

## 4. Prepare the database connection string

The structure is:

```text
postgresql://USERNAME:ENCODED_PASSWORD@POOLER_HOST:5432/postgres
```

For your project, replace only the password placeholder:

```dotenv
DATABASE_URL=postgresql://postgres.quvogykwweidzfbfaiyw:YOUR_ENCODED_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

Do not keep literal square brackets or the placeholder text in the real URI.

### Password encoding

Encode reserved characters only in the password. For a fictitious example:

```text
Original password: demo@123
Encoded password:  demo%40123
```

| Character | Encoded value |
| --- | --- |
| `@` | `%40` |
| `#` | `%23` |
| `/` | `%2F` |
| `?` | `%3F` |
| `%` | `%25` |

Do not encode the complete URI, and do not encode an already encoded password again. When pgAdmin asks for a password in its separate Password field, use the original password instead.

In a local `.env` file, include `DATABASE_URL=`. In a Render value field, paste only the part starting with `postgresql://`.

## 5. Get the database certificate

1. In your Supabase project, open the database settings and find **SSL Configuration**.
2. Download the CA certificate. The certificate is free.
3. Keep the downloaded certificate for the Render secret-file step.

This app uses `verify-full`: it encrypts the PostgreSQL connection and checks the certificate and hostname. [Supabase SSL documentation](https://supabase.com/docs/guides/platform/ssl-enforcement)

A certificate was previously downloaded locally as `database/supabase-ca.crt`. If that file exists, open it from the project root:

```powershell
notepad .\database\supabase-ca.crt
```

Copy the complete certificate, including:

```text
-----BEGIN CERTIFICATE-----
...certificate contents...
-----END CERTIFICATE-----
```

The text above is a format example, not a usable certificate. Use your downloaded file. Do not disable certificate verification to fix a certificate error.

## 6. Create the Render backend

1. Open [Render Dashboard](https://dashboard.render.com/).
2. Choose **New -> Web Service**.
3. Connect GitHub and select `sakthi-cannyfore/next-crud`.
4. Select branch `main` and a region near your database.
5. Configure:

| Setting | Value |
| --- | --- |
| Name | Choose a service name, or reuse your existing service |
| Language / Runtime | Node |
| Root Directory | **Leave empty** |
| Health Check Path | `/health` |

The empty root is correct when `frontend`, `backend`, `database`, and the root package files are directly at the top of the repository. If GitHub instead contains a wrapper folder holding all of them, use that wrapper folder as the Render root. Never select `backend/src` or only `backend` for these workspace commands. [Render monorepo documentation](https://render.com/docs/monorepo-support)

### Build Command

Paste exactly this, without a `$` prompt:

```bash
npm ci --include=dev && npm run build -w database && npm run build -w backend
```

It installs dependencies, compiles the shared database package, and then compiles Express. `--include=dev` ensures TypeScript is available during the build.

### Start Command

```bash
npm run migration:run:prod -w database && npm run start -w backend
```

This runs compiled migrations and starts the compiled Express server only if migrations succeed. It does not run the Next.js frontend. Use this simple startup flow with one backend instance; see section 13 for multiple instances.

## 7. Set Render environment variables and certificate

Before the first deployment, open the service's **Environment** settings and add these keys individually:

| Key | Value | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Full Supabase session-pooler URI with your encoded password | Private database connection |
| `DATABASE_SSL_MODE` | `verify-full` | Verify database TLS |
| `DATABASE_SSL_CA_PATH` | `/etc/secrets/supabase-ca.crt` | Certificate path inside Render |
| `FRONTEND_URL` | `https://next-crud-one-drab.vercel.app` | Allowed frontend origin |
| `NODE_ENV` | `production` | Production runtime |
| `NODE_VERSION` | `22` | Match this project's Node version |

Enter values without quotes, Markdown brackets, or `KEY=` prefixes. The database URI contains a secret and belongs only in backend configuration. Let Render supply `PORT`; the backend already reads it and listens on `0.0.0.0`.

### Add the certificate secret file

1. Under **Environment -> Secret Files**, select **Add Secret File**.
2. **Filename:** enter `supabase-ca.crt`.
3. **Contents:** paste the whole certificate copied in section 5.
4. Save the file and variables.

The resulting Render path is `/etc/secrets/supabase-ca.crt`, exactly matching the environment variable. Do not paste a Windows path into that variable, and do not paste the file path instead of its contents into the Contents field. [Render variables and secret files](https://render.com/docs/configure-environment-variables)

Local `.env` files are ignored by Git and are not uploaded to Render. `.env.production.example` files are documentation templates; neither hosting service loads them automatically.

## 8. Deploy Render and run migrations

1. Deploy the service. For an existing failed deployment, save the corrected settings and use **Manual Deploy -> Clear build cache & deploy** if the old cache needs clearing.
2. Inspect the deployment logs.
3. Confirm the database and backend builds finish.
4. Confirm the migration succeeds, or reports **No migrations are pending**.
5. Confirm Express starts and Render marks the deployment live.

The initial migration creates `public.users` and TypeORM's migration-history table. It enables row-level security on users without public Data API policies. Express connects with the database-owner connection. Do not create the users table manually before applying this migration.

Your expected backend host is:

```text
https://next-crud-1-ld5m.onrender.com
```

For a newly created service, substitute the URL Render actually assigns.

### Check the backend before continuing

Open:

```text
https://next-crud-1-ld5m.onrender.com/health
```

Expected response:

```json
{ "status": "ok" }
```

This endpoint executes a database query, so it checks both Express and its PostgreSQL connection.

Then open:

```text
https://next-crud-1-ld5m.onrender.com/api/users
```

Expected: a JSON array, either `[]` for an empty table or your existing saved users. `/` and `/api` alone do not have data routes; a 404 there does not mean the users API is broken.

The hosted database is independent of local PostgreSQL. Applying schema migrations does not copy old local records to Supabase.

## 9. Deploy or configure the Vercel frontend

1. Open [Vercel Dashboard](https://vercel.com/dashboard).
2. For a new frontend, choose **Add New -> Project** and import the same GitHub repository. For your existing frontend, open its project settings.
3. Use the settings below:

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Include source files outside the Root Directory in the Build Step | Enabled |
| Install Command override | `cd .. && npm ci --include=dev` |
| Build Command | `npm run build` |
| Output Directory | Leave the Next.js default |
| Node.js Version | 22.x |

The install command reaches the root lockfile. The build command runs in `frontend`, so it builds only Next.js. If the repository uses a wrapper folder, set the frontend root to `WRAPPER/frontend` instead. [Vercel monorepos](https://vercel.com/docs/monorepos), [outside-root files](https://vercel.com/docs/monorepos/monorepo-faq)

### Set the frontend API address

Go to **Settings -> Environment Variables** and add:

| Field | Enter |
| --- | --- |
| Key / Name | `NEXT_PUBLIC_API_URL` |
| Value | `https://next-crud-1-ld5m.onrender.com/api` |
| Environment | Production; also Preview if you deliberately configure preview access |
| Type, if offered | Config / non-secret |

The value is a public API address, not a credential. Do not add a database URI, database password, or Supabase service key to the frontend. Environment variables are supported on Vercel's Hobby plan; use the existing Production environment, not a new custom environment. [Vercel environment variables](https://vercel.com/docs/environment-variables)

The base address must end in `/api`, not `/api/users`: the frontend appends `/users` itself. Paste only the HTTPS URL, without `=`, brackets, or quotes.

### Deploy or redeploy

1. Save the variable.
2. For a new project, deploy. For an existing one, go to **Deployments** and redeploy the latest commit with the new environment value. If changing build-time settings, rebuild without reusing the old build cache.
3. Wait for a successful deployment before testing the production domain.

Next.js bundles `NEXT_PUBLIC_*` values at build time. Changing the dashboard value does not change an already-built page. [Managing Vercel environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables)

The code has the Render URL as its production fallback, but set the variable explicitly. A mistakenly configured `localhost` value overrides that fallback. Localhost in a deployed page means the visitor's computer, not Render.

## 10. Connect CORS and verify the complete flow

### 10.1 Confirm Render's frontend origin

On Render, set:

```dotenv
FRONTEND_URL=https://next-crud-one-drab.vercel.app
```

Use the frontend origin only: no trailing slash, `/api`, or page path. Save and deploy the Render service after an environment change.

The backend allows this Vercel domain plus the origin in `FRONTEND_URL` (localhost if unset). A separate Vercel preview domain is not automatically allowed; test on the configured production domain.

### 10.2 Verify persistence

1. Open https://next-crud-one-drab.vercel.app.
2. Add a disposable user with a unique email.
3. Confirm it appears in the table.
4. Refresh the page and confirm the row remains.
5. Edit the name or role and save.
6. Check the same record in Supabase using section 11.
7. Delete the disposable user through the frontend and confirm removal in Supabase.

This verifies the full path: browser -> Vercel JavaScript -> Render API -> Supabase data.

If using a free Render web service, an idle service can take time to wake up. The frontend request timeout is 15 seconds. If the first request times out, open `/health`, wait for a response, and refresh the frontend. [Render free service limitations](https://render.com/docs/free)

## 11. View cloud users in Supabase or pgAdmin

### Supabase SQL Editor

Select the same project used in Render's `DATABASE_URL`, open **SQL Editor**, and run:

```sql
SELECT id, name, email, role, created_at, updated_at
FROM public.users
ORDER BY created_at DESC;
```

You can also open **Table Editor -> users**. RLS being enabled without public policies does not prevent the database owner from managing its table.

### pgAdmin connection to Supabase

Register a separate server in pgAdmin; do not reuse the localhost connection if you want cloud records.

| Field | Value for the provided session-pooler connection |
| --- | --- |
| Host | `aws-0-ap-south-1.pooler.supabase.com` |
| Port | `5432` |
| Maintenance database | `postgres` |
| Username | `postgres.quvogykwweidzfbfaiyw` |
| Password | Original Supabase database password, not URL-encoded |
| SSL mode | `verify-full` |
| Root certificate | The downloaded Supabase CA file on your computer |

Confirm the host and username in your project's Connect dialog. Save, open this server's `postgres` database, and launch a **new Query Tool tab**. Old query tabs keep their old connections. [Supabase pgAdmin connection guide](https://supabase.com/docs/guides/database/pgadmin)

Run:

```sql
SELECT current_database(), current_user, to_regclass('public.users');
SELECT * FROM public.users ORDER BY created_at DESC;
```

The cloud database in this guide is `postgres`; `current_user` is the actual PostgreSQL role, normally `postgres` for this owner connection. The pooler login includes the project reference to route your connection.

`users_crud` is a local database name used earlier. A query such as `SELECT * FROM users_crud` is incorrect: SQL queries a table, whose name here is `public.users`.

## 12. Run locally when needed

Cloud deployment does not require you to run these commands or keep local ports open. Use this section only for development.

### 12.1 Install and prepare files once

```powershell
cd 'C:\Users\Sakthi\OneDrive - Cannyfore Technology Solutions Pvt Ltd\Desktop\nextjs-with-deployment'
npm ci
if (-not (Test-Path database/.env)) { Copy-Item database/.env.example database/.env }
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (-not (Test-Path frontend/.env.local)) { Copy-Item frontend/.env.example frontend/.env.local }
```

These copy commands preserve existing configuration.

### 12.2 Choose your development database

For local PostgreSQL, create a database in pgAdmin:

```sql
CREATE DATABASE users_crud;
```

Example `database/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:YOUR_ENCODED_LOCAL_PASSWORD@localhost:5432/users_crud
DATABASE_SSL_MODE=disable
DATABASE_SSL_CA_PATH=
```

Make sure your local PostgreSQL Windows service is running. If you intentionally use another local instance or port, match its details in both the URI and pgAdmin.

Alternatively, point the local backend at Supabase:

```dotenv
DATABASE_URL=YOUR_FULL_SUPABASE_CONNECTION_STRING
DATABASE_SSL_MODE=verify-full
DATABASE_SSL_CA_PATH=C:/YOUR/CERTIFICATE/FOLDER/supabase-ca.crt
```

Use an absolute path to a real certificate on this computer. A local backend using the production Supabase URI edits the same cloud records as the deployed backend; use a separate development project when appropriate.

### 12.3 Configure local API and frontend

`backend/.env`:

```dotenv
PORT=4000
FRONTEND_URL=http://localhost:3000
```

`frontend/.env.local`, when using the local backend:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Run from the root:

```powershell
npm run db:migrate
npm run dev
```

This starts both the API on 4000 and the frontend on 3000. Open http://localhost:3000. Start it once, not once per folder.

To use only the local frontend against the hosted backend, set `NEXT_PUBLIC_API_URL` to the Render API URL and run `npm run dev -w frontend`. Render must allow `http://localhost:3000` in its CORS configuration for this mode; the production `FRONTEND_URL` currently allows the Vercel origin. You can instead use the local backend as described above.

If changing any `.env` values, restart the affected local process. `.env.local` can override `.env.production` during a local production build; Vercel reads the variables configured in its dashboard because ignored local files are not uploaded.

### 12.4 Stop and restart

Press **Ctrl+C** in the terminal running `npm run dev`. This stops the frontend and backend, not the PostgreSQL Windows service.

If port 3000 is already in use, another frontend may still be running. Stop the earlier terminal before starting again. Do not launch a second `next dev` for the same frontend directory. To inspect only the app ports in PowerShell:

```powershell
Get-NetTCPConnection -State Listen | Where-Object LocalPort -in 3000,3001,4000
```

## 13. Apply future changes and migrations

### Code changes

1. Change the code locally.
2. Run checks:

```powershell
npm run typecheck
npm run build
```

3. Review the diff, commit, and push to the connected deployment branch.
4. With automatic deployment enabled, Render and Vercel rebuild from GitHub. Check both deployment logs.
5. Environment changes are separate: update their dashboard variables and trigger the required redeployment.

### Database schema changes

1. Update `database/src/entities/User.ts`.
2. Point `database/.env` at the development database you want to compare against.
3. Generate a migration from the project root:

```powershell
npm run migration:generate -w database -- src/migrations/DescribeYourChange
```

4. Review the generated SQL before applying it.
5. Apply and inspect migration status:

```powershell
npm run db:migrate
npm run migration:show -w database
```

6. Commit both the entity change and migration source.
7. Deploy. Render compiles the migration and applies it in the configured start command.

Migration discovery is automatic; you do not manually register a class. `synchronize` is disabled so schema changes happen through migrations.

`[X]` in migration status means applied. **No migrations are pending** is a success message, not an error.

| Current terminal folder | Migration command |
| --- | --- |
| Project root | `npm run db:migrate` |
| `backend` | `npm run db:migrate` |
| `database` | `npm run migration:run` |

The combined `npm run dev` belongs in the project root. There is no `dev` script inside `database`.

`npm run db:revert` undoes the last migration against the configured database. Reverting the initial migration drops the users table and all its rows; do not use it to resolve a connection issue.

For multiple backend instances, move migration execution into one release job instead of running it in every instance. On Render services supporting a pre-deploy command, use `npm run migration:run:prod -w database` there and use `npm run start -w backend` as the start command. [Render deployment lifecycle](https://render.com/docs/deploys)

## 14. Troubleshooting

| Error or symptom | Fix |
| --- | --- |
| `No workspaces found --workspace=database` | Check the root package file, all workspace folders, GitHub branch, and Render Root Directory. An empty root works only when those files are at repository top level. |
| `Cannot find module @users/database` | Install from the repository root and compile the database workspace before the backend. |
| `tsc` is missing on Render | Use `npm ci --include=dev` in Build Command. |
| `Missing script: db:migrate` inside database | Use `npm run migration:run`, or `cd ..` then `npm run db:migrate`. |
| `Missing script: dev` inside database | Return to the project root and run `npm run dev`. |
| `No migrations are pending` | Success: existing migrations are applied. |
| `password authentication failed` | Verify database password, project-specific pooler username, and password encoding in the URI. |
| `fe_sendauth: no password supplied` in pgAdmin | Fill in its Password field with the original database password and save/reconnect. |
| `self-signed certificate in certificate chain` | Supply the correct Supabase CA, check its contents, and keep `verify-full`. |
| `ENOENT` for the CA file on Render | Add the secret file with exact name `supabase-ca.crt`; use `/etc/secrets/supabase-ca.crt`, not a Windows path. |
| `relation public.users does not exist` | Confirm the same Supabase project/database is selected and migrations ran there. A localhost pgAdmin connection shows different data. |
| `localhost:4000/api/users ERR_CONNECTION_REFUSED` | The frontend is calling a local API. Set the Render API base URL in Vercel, redeploy, then hard-refresh. For deliberate local development, start the local API. |
| CORS error | Set Render's `FRONTEND_URL` to the exact Vercel production origin without a slash/path; redeploy Render. Test that domain rather than an unconfigured preview URL. |
| API URL becomes `/api/users/users` | Set `NEXT_PUBLIC_API_URL` to the base ending in `/api`, not `/api/users`. |
| `/` or `/api` on Render returns 404 | Use `/health` or `/api/users`; there is no root API route. |
| First request times out after inactivity | Wait for Render `/health` to respond, then reload the frontend. |
| Port 3000 in use / another Next server running | Stop the earlier local dev process; do not start another copy. |
| Updated variable has no effect | Restart locally; redeploy the affected cloud service. Next.js public values require a new frontend build. |
| Email already exists | Use another email. Emails are normalized to lowercase and unique. |

## 15. Deployment checklist

- [ ] GitHub contains all three folders and root package files on the selected branch.
- [ ] Render Root Directory matches the folder containing the root workspace package file.
- [ ] Supabase session-pooler URI contains the right project, host, database, and encoded password.
- [ ] Render has the six environment variables from section 7.
- [ ] Render has the certificate secret file at the configured path.
- [ ] Render builds database first, then backend.
- [ ] Migrations complete before the single backend instance starts.
- [ ] `/health` returns HTTP 200 and `status: ok`.
- [ ] `/api/users` returns a JSON array.
- [ ] Vercel uses `frontend` as its project root and the root npm lockfile for installation.
- [ ] Vercel's Production API variable points to the Render base URL ending in `/api`.
- [ ] Vercel was rebuilt after adding/changing the public API variable.
- [ ] Render's frontend origin matches the Vercel production domain.
- [ ] A record can be created, edited, refreshed, viewed in Supabase, and deleted.
- [ ] Real credentials are not committed; public production use has authentication and authorization.

For the earlier compact deployment reference, see [DEPLOYMENT.md](DEPLOYMENT.md). Additional local configuration notes are in [CONFIGURATION.md](CONFIGURATION.md).

The commands above match this repository's package scripts. Provider documentation was checked on October 23, 2026; dashboard labels may change.
