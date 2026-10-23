# Project requirements

- This project is a simple user CRUD application requested by the owner.
- Keep three folders: `frontend` (Next.js App Router), `backend` (Express), and `database` (PostgreSQL entities and TypeORM migrations).
- Use TypeScript. Use TypeORM, not Prisma. Keep `synchronize: false`; change schemas through migrations.
- Each user has a name, unique normalized email, and role (`admin`, `editor`, `viewer`). Roles are directory labels, not authentication or authorization.
- Keep the UI plain: one inline form and a users table with edit and delete actions. No dashboard, sidebar, cards, search, filters, avatars, or modal components.
- Support local PostgreSQL, Supabase PostgreSQL, and Neon PostgreSQL. Keep database secrets out of the frontend.
- Keep installation steps and environment/deployment configuration in root `CONFIGURATION.md`.
- Preserve a simple single business table; TypeORM also creates its own migrations tracking table.
- The owner wants simple code. Do not add test cases, test dependencies, YAML files, Docker configuration, screenshots, or extra features.
- Keep backend routes in `backend/src/server.ts`, with plain validation and short explanatory comments. Use one exported connection in `database/src/data-source.ts`, one DATABASE_URL, and automatic migration discovery. Avoid factories, barrel files, and manual migration registration.
- Before delivering changes, run `npm run typecheck` and `npm run build` when dependencies are available. Report any checks that could not run.
- This starter has no authentication. Require authentication and authorization before exposing write endpoints to untrusted users.
