# AGENTS.md

## Cursor Cloud specific instructions

BlurayPOS = .NET 9 backend API + two React (Vite) frontends + PostgreSQL. Standard build/run/test commands are in `README.md`; only the non-obvious cloud caveats are captured here.

### Services

| Service | Dir | Run (dev) | URL |
|---------|-----|-----------|-----|
| Backend API | `backend/src/Pos.Api` | `dotnet run` | http://localhost:5142 (Swagger at `/swagger`, health at `/health`) |
| POS Terminal | `frontend` | `npm run dev` (starts both apps) | http://localhost:5173 |
| Admin Portal | `frontend` | `npm run dev` (starts both apps) | http://localhost:5174 |
| PostgreSQL 16 | — | see below | localhost:5432 |

### Startup caveats (not handled by the update script)

- **Start PostgreSQL before the backend**: `sudo pg_ctlcluster 16 main start`. It does not auto-start on boot. DB `pos_dev` with `postgres`/`postgres` already exists in the snapshot.
- **dotnet is at `$HOME/.dotnet`** (installed via the official script, not apt). `DOTNET_ROOT` and PATH are set in `~/.bashrc`; a non-login/non-interactive shell may need `export PATH="$HOME/.dotnet:$PATH"` first.
- **Migrations + demo seed run automatically** on backend startup in `Development` (via `DataSeeder`), so no manual `dotnet ef database update` is needed. Demo login credentials are in `README.md`.
- **Frontend needs no `.env`**: the API client defaults to `http://localhost:5142` when `VITE_API_URL` is unset.

### Testing

- Backend: `dotnet test backend/Pos.slnx` — the integration tests boot the real app via `WebApplicationFactory`, so **PostgreSQL must be running** or they fail.

### Known pre-existing issue (not an environment problem)

- `GET /api/reports/dashboard` (the Admin Portal home "Dashboard") returns a 500 with an EF Core "could not be translated" LINQ error. This is an application bug in existing code, unrelated to environment setup; the rest of the app (login, catalog CRUD, orders, etc.) works.
