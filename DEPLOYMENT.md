# Deploy this project: Vercel + Render + Supabase

The deployment order is GitHub, Supabase, Render, then Vercel.

```text
Browser -> Next.js on Vercel -> Express on Render -> PostgreSQL on Supabase
```

Keep all three folders in one repository:

```text
your-repository/
  frontend/
  backend/
  database/
  package.json
  package-lock.json
  .gitignore
```

The `database` folder contains the entity and migrations. Supabase runs PostgreSQL; you do not deploy this folder as another server. Your local PostgreSQL services and Windows ports are not used by the hosted application.

This starter has no login or authorization. Use disposable demo data for a public demonstration; add authentication and server-side authorization before storing real user data. CORS and the role field do not protect the write API.

## 1. Put the project on GitHub

1. Create a GitHub repository, preferably private.
2. Upload/push this entire project, including the root package files and all three source folders. You can use your editor's Source Control panel or GitHub Desktop.
3. Check that the repository contains `package-lock.json`.
4. Do not upload `.env` files, `node_modules`, `.next`, `dist`, or `database/.local-postgres`. The existing `.gitignore` excludes them.

The hosting platforms install dependencies and build the compiled files themselves. Nothing needs to be published to npm.

## 2. Create the Supabase database

1. Sign in to [Supabase](https://supabase.com/dashboard) and create a project.
2. Choose a region near the region you will use for Render.
3. Save the project's database password privately. This is different from your Supabase account password.
4. Once the project is ready, open **Connect** and select **Session pooler**.
5. Copy the PostgreSQL URI and replace its password placeholder with your database password. Use the exact hostname and username shown by Supabase.

Example structure only:

```text
postgresql://postgres.PROJECT_REF:ENCODED_PASSWORD@YOUR_POOLER_HOST:5432/postgres
```

Use session mode on port 5432 for this guide, rather than transaction mode on 6543. It supports this persistent Express server and IPv4 access. The same connection is used for migrations. [Supabase connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres)

The default Supabase database is named `postgres`. You do not need to create `users_crud` there. The migration will create `public.users` inside the database named in your URI. Local users are not copied automatically.

If your password contains special characters, URL-encode them in the URI: `@` becomes `%40`, `#` becomes `%23`, and `/` becomes `%2F`. Do not URL-encode the whole URI.

In the project's database SSL settings, download the database CA certificate. The application uses certificate verification; the next step will supply this certificate to Render. [Supabase SSL guide](https://supabase.com/docs/guides/platform/ssl-enforcement)

## 3. Deploy Express on Render

1. Sign in to [Render](https://dashboard.render.com/).
2. Select **New -> Web Service** and connect the same GitHub repository.
3. Configure these values:

| Setting | Value for this project |
| --- | --- |
| Name | Choose a name, such as `users-api` |
| Branch | The branch containing your code |
| Runtime / Language | Node |
| Root Directory | Leave empty: use the repository root |
| Build Command | `npm ci --include=dev && npm run build -w database && npm run build -w backend` |
| Start Command | `npm run migration:run:prod -w database && npm run start -w backend` |
| Health Check Path | `/health` |

Do not set the Render root directory to `backend`: it also needs the shared `database` workspace and root lockfile. These commands are written for your existing package scripts. [Render monorepo guide](https://render.com/docs/monorepo-support), [Express deployment guide](https://render.com/docs/deploy-node-express-app)

### Render environment variables

Add these under the service's **Environment** settings:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | The full Supabase session-pooler PostgreSQL URI |
| `DATABASE_SSL_MODE` | `verify-full` |
| `DATABASE_SSL_CA_PATH` | `/etc/secrets/supabase-ca.crt` |
| `FRONTEND_URL` | `http://localhost:3000` temporarily; replace after Vercel deployment |
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |

Let Render supply `PORT`. The backend already reads it. Do not copy your local `PORT=4000` setting to Render.

Under **Secret Files**, add a file named `supabase-ca.crt`. Paste the full contents of the downloaded CA certificate, including the BEGIN/END CERTIFICATE lines. Render exposes this file at `/etc/secrets/supabase-ca.crt`. Never set the path to a Windows file location on Render. [Render environment variables and secret files](https://render.com/docs/configure-environment-variables)

### Start the deployment

1. Create/deploy the Web Service.
2. Read its logs. The build compiles the database package before compiling Express.
3. On startup, the command applies pending migrations, then starts Express. If migration fails, the command stops and the API does not start.
4. Copy the actual URL Render assigns, for example `https://users-api-EXAMPLE.onrender.com`.
5. Open that URL with `/api/users` appended. It should return `[]` initially.

The root path `/` has no API route. `/health` checks the database connection; `/api/users` returns users. Do not add a second Node process or run `npm run dev` on Render.

This start command is a simple single-instance setup and runs migrations again safely when the service restarts. For a later deployment with multiple API instances, run migrations once in a separate release step. Render's pre-deploy command is available on paid services: set it to `npm run migration:run:prod -w database`, and then use `npm run start -w backend` as the start command. [Render deploy lifecycle](https://render.com/docs/deploys)

Free Render services can sleep when idle. A first request may take longer than the frontend's 15-second timeout; open `/api/users`, wait until it responds, then reload the frontend. [Render free-instance limitations](https://render.com/docs/free)

## 4. Deploy Next.js on Vercel

1. Sign in to [Vercel](https://vercel.com/).
2. Select **Add New -> Project** and import the same GitHub repository.
3. Choose these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Include source files outside the Root Directory in the Build Step | Enabled |
| Install Command, override | `cd .. && npm ci --include=dev` |
| Build Command | `npm run build` |
| Output Directory | Leave the Next.js default |
| Node.js Version | 22.x |

The install command uses the repository's root lockfile. The build command runs from `frontend`, so it builds only Next.js. [Vercel monorepos](https://vercel.com/docs/monorepos), [accessing files outside the root](https://vercel.com/docs/monorepos/monorepo-faq)

Add this Vercel environment variable before deploying:

```dotenv
NEXT_PUBLIC_API_URL=https://YOUR-ACTUAL-RENDER-HOST.onrender.com/api
```

Replace the example host with your Render URL. Keep `/api` at the end, and use HTTPS. This is a public API address, not a secret. Do not add `DATABASE_URL`, a database password, or a Supabase service key to Vercel.

Deploy the project and copy its production domain, for example `https://YOUR-PROJECT.vercel.app`. If you change `NEXT_PUBLIC_API_URL`, redeploy Next.js because this value is embedded during the build.

## 5. Allow the Vercel frontend in Render

1. Return to the Render API service's **Environment** settings.
2. Replace `FRONTEND_URL` with the actual Vercel production origin:

```dotenv
FRONTEND_URL=https://YOUR-PROJECT.vercel.app
```

3. Use only the origin: no trailing slash, `/api`, or page path.
4. Save and deploy/restart the Render service so it reads the new value.

The backend allows `https://next-crud-one-drab.vercel.app` plus the origin configured in `FRONTEND_URL` (localhost by default). Vercel's individual preview deployment URLs will not automatically match these origins.

## 6. Verify saved data

1. Open the Vercel production URL.
2. Add a disposable user, edit it, and refresh the page.
3. In Supabase, open **SQL Editor** and run:

```sql
SELECT * FROM public.users ORDER BY created_at DESC;
```

You should see the record saved through the Vercel frontend and Render API. You can also inspect `users` through Supabase's Table Editor. The table has RLS enabled without public Data API policies; Express uses the database owner connection.

If you prefer pgAdmin, register a new connection using the Supabase session-pooler host, port `5432`, username `postgres.PROJECT_REF`, database `postgres`, and your Supabase database password. Use the exact values from Connect. For TLS, select `verify-full` and set the downloaded certificate as the root certificate. Do not use localhost or the local Windows database connection to inspect cloud records.

## Common problems

| Problem | What to check |
| --- | --- |
| Render cannot find `@users/database` | Root Directory must be empty; build the database workspace first |
| `tsc` is missing | Use `npm ci --include=dev` in the build command |
| Certificate error | CA file contents and `/etc/secrets/supabase-ca.crt` path; keep `verify-full` |
| Database password error | Supabase database password, pooler username, URL-encoded password |
| Database network error | Use the session-pooler URI from Supabase Connect |
| `public.users` does not exist | Check migration logs and verify you are querying the same Supabase project/database as Render |
| API returns JSON, frontend fails | Exact `FRONTEND_URL` origin and Vercel's API environment variable |
| Frontend calls localhost | Set the Render API URL in Vercel, then redeploy |
| First request times out | Wait for the Render API to wake up, then refresh |

Checked against the current project scripts and official provider documentation on October 23, 2026. This guide does not deploy accounts or move existing local records.
