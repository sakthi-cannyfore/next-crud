# Installation and configuration

Use [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel, Render, and Supabase. The instructions below describe local development. Your active database is the one configured in `database/.env`; select the same host, port, and database in pgAdmin.

## Which files should I read?

1. `database/src/entities/User.ts`: describes the columns in a user record.
2. `database/src/data-source.ts`: connects TypeORM to PostgreSQL and finds migration files.
3. `database/src/migrations/1792713600000-CreateUsers.ts`: `up()` creates the table; `down()` drops it. The numeric suffix is TypeORM's migration timestamp.
4. `backend/src/server.ts`: starts Express and contains the four CRUD routes. Each route calls the users repository to read or write PostgreSQL.

For an update, the code finds the user, changes name/email/role, and saves it. Validation uses ordinary `if` statements. All routes share one error handler at the bottom of the file.

## 1. Install dependencies

Install Node.js 22 or newer and PostgreSQL 13 or newer, or use Supabase/Neon.
Run these commands from the project root:

```powershell
npm install
Copy-Item database/.env.example database/.env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Copy the environment files only once. Keep passwords out of Git and the frontend.

## 2. Configure PostgreSQL

Choose one option below. The frontend talks to Express; only Express connects to the database.

### Local PostgreSQL

Create a database in pgAdmin or psql:

```sql
CREATE DATABASE users_crud;
```

Set `database/.env` using your PostgreSQL username and password:

```dotenv
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/users_crud
DATABASE_SSL_MODE=disable
DATABASE_SSL_CA_PATH=
```

### Supabase

1. Create a project and open its Connect dialog.
2. Copy the PostgreSQL session-pooler URI into `DATABASE_URL`. This works with IPv4 hosts.
3. The backend and migrations use this same URI. Avoid the transaction pooler.
4. Set `DATABASE_SSL_MODE=verify-full`.
5. If needed, download the database CA certificate from Supabase and set `DATABASE_SSL_CA_PATH` to its absolute path, for example `C:/certificates/supabase-ca.crt`.

Use the database password and owner connection, not the Supabase API keys. The migration enables row-level security without public policies; Express connects as the table owner.

### Neon

1. Create a project and open Connect.
2. Copy its direct PostgreSQL connection URI into `DATABASE_URL` (turn pooling off).
3. The backend and migrations use this same connection.
4. Set `DATABASE_SSL_MODE=verify-full` and leave `DATABASE_SSL_CA_PATH` empty unless a custom CA is required.

Use the exact URI from your provider. URL-encode special characters in passwords, such as `@` as `%40`. Hosted connections verify TLS certificates.

## 3. Configure backend and frontend

`backend/.env`:

```dotenv
PORT=4000
FRONTEND_URL=http://localhost:3000
```

`frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Restart the servers after editing these files. Never put a database password in `NEXT_PUBLIC_API_URL`.

## 4. Run migrations and start

```powershell
npm run db:migrate
npm run dev
```

`npm run db:migrate` works from either the project root or the `backend` folder. Inside the `database` folder, use `npm run migration:run`.

Open http://localhost:3000. Fill in name, email, and role to add a user. Use Edit to populate the same form, then Update user. Delete asks for confirmation.

The business table is `users`: id, name, unique lowercase email, role, and timestamps. TypeORM also creates a migration-history table. Roles are labels (`admin`, `editor`, `viewer`), not access permissions.

## 5. Migration commands

```powershell
npm run migration:show -w database
npm run migration:generate -w database -- src/migrations/YourChange
npm run db:migrate
```

Migrations are loaded automatically from `database/src/migrations/`. No manual registration is needed. Read the generated SQL before running it. Rebuild the database package and restart the API after entity changes:

```powershell
npm run build -w database
```

`npm run db:revert` undoes the last migration. Reverting the initial migration deletes the users table and its data. Automatic schema synchronization is disabled.

## 6. API routes

| Method | URL | Action |
| --- | --- | --- |
| GET | `/api/users` | List users |
| POST | `/api/users` | Add user |
| PUT | `/api/users/:id` | Update name, email, and role |
| DELETE | `/api/users/:id` | Delete user |

POST and PUT accept JSON:

```json
{ "name": "Alex", "email": "alex@example.com", "role": "viewer" }
```

## 7. Build and deploy

For the complete dashboard walkthrough, see [DEPLOYMENT.md](DEPLOYMENT.md).

Supabase/Neon host the database; frontend and backend need application hosting.

- Backend: install from the repository root with `npm ci`; build with `npm run build -w database && npm run build -w backend`; run compiled migrations once with `npm run migration:run:prod -w database`; start with `npm run start -w backend`.
- Set database variables and `FRONTEND_URL` on the backend host. Use the deployed frontend origin for `FRONTEND_URL` and the host's assigned `PORT`.
- Frontend: set `NEXT_PUBLIC_API_URL=https://YOUR-API-HOST/api` before building; build with `npm run build -w frontend`; start with `npm run start -w frontend -- --port 3000` (use the port required by your host).
- Keep the repository root available for workspace dependency installation. A custom CA path must exist on the backend host.

This simple application has no login. Add authentication and authorization before allowing public access to the write API.

## Troubleshooting

- Cannot reach API: check the backend is running, the API URL includes `/api`, and `FRONTEND_URL` matches the browser origin.
- Database connection fails: check the URI, password, PostgreSQL service, and TLS/CA settings.
- Table does not exist: run `npm run db:migrate` before starting the backend.
- Duplicate email: use another email address.
