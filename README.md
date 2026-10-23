# User CRUD application

- `frontend/`: Next.js form and users table.
- `backend/`: Express CRUD API.
- `database/`: PostgreSQL entity and TypeORM migrations.

See [CONFIGURATION.md](CONFIGURATION.md) for installation and database configuration.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the step-by-step Vercel frontend, Render backend, and Supabase database deployment guide.

After configuring the environment files:

```powershell
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000.

```powershell
npm run typecheck
npm run build
```

Use Node.js 22 for deployment (`.nvmrc`). Each folder includes `.env.production.example` showing the variables to configure on Vercel or Render. These are templates, not real credentials.

The root and per-folder `.gitignore` files exclude secrets, dependencies, build output, and local database storage. Commit `package-lock.json` and migration sources. If secrets were already committed to Git, ignore rules do not remove them from history; remove the tracked secrets and rotate the exposed credentials.

The backend's `/health` endpoint checks PostgreSQL for Render health checks. This starter still needs authentication and authorization before exposing real user data publicly.
