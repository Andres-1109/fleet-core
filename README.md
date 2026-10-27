# FleetCore API (car-fix-app)

REST API for managing a vehicle fleet and its maintenance: vehicles, mechanics,
workshops, and the full life cycle of maintenance jobs — scheduling, mechanic
schedule-conflict detection, a strict state machine, and automatic vehicle-status
synchronization. It includes JWT authentication with roles, API-key access for
external integrations, optional Google sign-in, and interactive Swagger docs.

## Coder

| | |
|---|---|
| **Name** | Andres Felipe Giraldo Acosta |
| **Clan** | Node Js Am |
| **GitHub** | [Andres-1109](https://github.com/Andres-1109) |

## Tech stack

| Area | Technology |
|---|---|
| Runtime / language | Node.js 24, TypeScript 6 (strict) |
| Framework | NestJS 12 (Express) |
| Database | PostgreSQL 16 with TypeORM 1.x and migrations |
| Auth | JWT (`@nestjs/jwt`, Passport), bcrypt, API keys, Google OAuth 2.0 |
| Validation | class-validator / class-transformer |
| Docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Tests | Jest + ts-jest |
| Quality | ESLint (strict type-checked rules) + Prettier |
| Packaging | Docker (multi-stage) + Docker Compose |

## Prerequisites

- **Docker** with the Compose plugin (`docker compose`) — for the Docker path.
- **Node.js 24** and **npm** — for running locally or running the tests.
- A **PostgreSQL 16** server — only if you run locally without Docker (the
  Compose file can provide one, see below).
- **Git**.

## Installation

```bash
git clone https://github.com/Andres-1109/fleet-core.git
cd fleet-core
cp .env.example .env
npm install
```

Then edit `.env`. The defaults work as they are; at minimum change
`JWT_SECRET` to a long random value for anything other than a local demo.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the API listens on (local runs) |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | Database address (local runs) |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | `postgres` / `postgres` / `fleetcore` | Database credentials |
| `JWT_SECRET` | `change-this-secret` | Secret used to sign access tokens |
| `JWT_EXPIRES_IN` | `1h` | Access-token lifetime |
| `API_KEYS` | `demo-key-partner-1,demo-key-partner-2` | Comma-separated keys accepted by the external endpoint |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | placeholders | Google sign-in (optional, see [Google login](#google-login)) |
| `API_HOST_PORT` | `3000` | Docker only: host port mapped to the API container |
| `DB_HOST_PORT` | `5432` | Docker only: host port mapped to the PostgreSQL container |

The app validates these at startup and refuses to boot with an invalid value.

## Run with Docker

```bash
docker compose up --build
```

This starts PostgreSQL (data kept in the `postgres-data` volume) and the API on
an internal network. **The API container applies all pending migrations before it
starts**, so the schema is created automatically.

Load the demo data (idempotent — safe to run any number of times):

```bash
docker compose exec api npm run seed:prod
```

- API: <http://localhost:3000>
- Swagger UI: <http://localhost:3000/api/docs>

Other useful commands:

```bash
docker compose logs -f api      # follow the API logs
docker compose down             # stop, keep the database
docker compose down -v          # stop and delete the database volume (fresh start)
```

> **Port already in use?** Set `API_HOST_PORT` and/or `DB_HOST_PORT` in `.env`
> (for example `API_HOST_PORT=3001`, `DB_HOST_PORT=5434`). Inside Docker the
> containers always talk to each other on fixed internal ports, so only the
> host side changes. If you also run the app or migrations on your host, set
> `DB_PORT` to the same value as `DB_HOST_PORT`.

## Run locally (without Docker for the API)

1. Have a PostgreSQL 16 server with an empty database named `fleetcore` — or
   start only the database from Compose:

   ```bash
   docker compose up -d postgres
   ```

2. Make `.env` match it (`DB_HOST=localhost`, `DB_PORT` equal to your server's
   port, and the same credentials).
3. Apply the migrations and start the API:

   ```bash
   npm run migration:run
   npm run start:dev          # watch mode; use "npm run build && npm run start:prod" for a production run
   ```

## Seeders

```bash
npm run seed            # local (ts-node)
docker compose exec api npm run seed:prod   # inside the Docker container
```

The seeder first applies any pending migrations, then inserts the demo data in
one transaction. It only inserts what is missing, so running it twice never
duplicates anything and never overwrites changes you made to seeded records.

### Test credentials (created by the seeder)

| Role | Email | Password | Notes |
|---|---|---|---|
| ADMIN | `admin@fleetcore.com` | `Admin123!` | Full access |
| MECHANIC | `mechanic1@fleetcore.com` | `Mechanic123!` | Active; owns the COMPLETED maintenance |
| MECHANIC | `mechanic2@fleetcore.com` | `Mechanic123!` | Active; owns the IN_PROGRESS maintenance |
| MECHANIC | `mechanic3@fleetcore.com` | `Mechanic123!` | **Inactive** — cannot log in or be assigned |

API keys for the external endpoint: `demo-key-partner-1`, `demo-key-partner-2`.

Seeded data: workshops *Central Workshop* (active) and *North Workshop*
(inactive); vehicles `ABC123` and `DEF456` (AVAILABLE), `GHI789` (IN_MAINTENANCE,
with a linked IN_PROGRESS maintenance), `JKL012` (INACTIVE); and a COMPLETED
maintenance for `ABC123` as history.

## Swagger / OpenAPI

Open <http://localhost:3000/api/docs> (raw spec: `/api/docs-json`).

1. Run **POST /auth/login** with `admin@fleetcore.com` / `Admin123!`.
2. Copy the `accessToken` from the response.
3. Click **Authorize**, paste the token (no `Bearer ` prefix needed) and confirm.
4. Every protected endpoint can now be tried from the page. The token is
   remembered across reloads.

Endpoints are grouped by tag: Auth, Mechanics, Vehicles, Workshops,
Maintenances and External. The External group authenticates with the
`x-api-key` header instead of a token.

## API overview

Every success response has the same shape, and so does every error:

```json
{ "success": true,  "statusCode": 200, "data": {}, "timestamp": "2026-10-20T19:00:00.000Z" }
{ "success": false, "statusCode": 409, "message": "Vehicle ABC123 already has an active maintenance", "path": "/maintenances", "timestamp": "2026-10-20T19:00:00.000Z" }
```

Status codes: `400` validation, `401` missing/invalid token or key, `403` role not
allowed, `404` not found, `409` business-rule conflict. Business and validation
errors never return `500`.

### Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | public | Register an ADMIN or MECHANIC user |
| POST | `/auth/login` | public | Log in, returns a JWT |
| GET | `/auth/google` | public | Start Google login (redirects to Google) |
| GET | `/auth/google/callback` | public | Google callback, returns a JWT |
| GET | `/mechanics` | ADMIN | List mechanics |
| GET | `/mechanics/:id` | ADMIN | Get a mechanic |
| POST | `/mechanics` | ADMIN | Create a mechanic |
| PATCH | `/mechanics/:id` | ADMIN | Update name, email or specialty |
| PATCH | `/mechanics/:id/status` | ADMIN | Toggle active / inactive |
| GET | `/vehicles` | ADMIN, MECHANIC | List vehicles |
| GET | `/vehicles/:identifier` | ADMIN, MECHANIC | Get a vehicle by id or plate |
| POST | `/vehicles` | ADMIN | Create a vehicle |
| PATCH | `/vehicles/:id` | ADMIN | Update a vehicle |
| DELETE | `/vehicles/:id` | ADMIN | Logical deletion (status → INACTIVE) |
| GET | `/workshops` | ADMIN, MECHANIC | List active workshops (`?includeInactive=true` for ADMIN) |
| GET | `/workshops/:id` | ADMIN, MECHANIC | Get a workshop |
| POST | `/workshops` | ADMIN | Create a workshop |
| PATCH | `/workshops/:id` | ADMIN | Update a workshop |
| PATCH | `/workshops/:id/status` | ADMIN | Toggle active / inactive |
| POST | `/maintenances` | ADMIN | Schedule a maintenance |
| GET | `/maintenances` | ADMIN | List maintenances (filters: status, type, vehicleId, mechanicId, workshopId) |
| GET | `/maintenances/active` | ADMIN, MECHANIC | SCHEDULED and IN_PROGRESS maintenances |
| GET | `/maintenances/vehicle/:vehicleId` | ADMIN | Maintenances of a vehicle |
| GET | `/maintenances/mechanic/:mechanicId` | ADMIN, MECHANIC (own) | Maintenances of a mechanic |
| PATCH | `/maintenances/:id/status` | ADMIN, MECHANIC (assigned) | Change a maintenance status |
| GET | `/external/vehicles/:plate/history` | `x-api-key` | Vehicle details and full maintenance history |

Example of the external endpoint:

```bash
curl http://localhost:3000/external/vehicles/ABC123/history \
  -H "x-api-key: demo-key-partner-1"
```

## Business rules

**Maintenance state machine** — `COMPLETED` and `CANCELLED` are terminal:

```
SCHEDULED   → IN_PROGRESS | CANCELLED
IN_PROGRESS → COMPLETED   | CANCELLED
```

**Vehicle side effects** (applied in the same database transaction as the status change):

| Transition | Vehicle |
|---|---|
| → IN_PROGRESS | becomes `IN_MAINTENANCE` |
| → COMPLETED (needs `workPerformed`, `finalCost`, `finalMileage`, `finishedAt`) | becomes `AVAILABLE`; its mileage advances to `finalMileage` |
| → CANCELLED | back to `AVAILABLE` if it was `IN_MAINTENANCE` |

**Creation rules** — a maintenance is rejected (`409`) when the vehicle is
INACTIVE, the mechanic or workshop is inactive, the vehicle already has an
active (SCHEDULED / IN_PROGRESS) maintenance, the mileage is below the vehicle's
current mileage, or the mechanic already has an active maintenance whose
`[start, end)` window overlaps. Back-to-back windows (one ends exactly when the
next starts) are allowed. The same two "one active per vehicle" and "no overlap
per mechanic" guarantees are also enforced by database constraints, so they hold
under concurrent requests.

**Roles** — mechanics can only read and change maintenances assigned to them.

## Google login

Google sign-in is optional. Until real credentials are configured the API runs
normally and `GET /auth/google` answers `503 Google login is not configured`.

1. In Google Cloud Console create an OAuth client of type **Web application**.
2. Add the callback URL as an authorized redirect URI, e.g.
   `http://localhost:3000/auth/google/callback` — it must use the port the API
   is actually reached on.
3. Put the client id, secret and callback URL in `.env`
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`) and restart.
4. Open `http://localhost:3000/auth/google` **in a browser**.

On the first login an active MECHANIC account is created for the Google email;
afterwards the same account is reused (an existing account with that verified
email — including an ADMIN — is signed in as itself). Google accounts have no
password. The callback returns the same JSON as `POST /auth/login`.

## Tests

```bash
npm test             # run all unit tests
npm run test:cov     # with a coverage report (also written to ./coverage)
```

The suite covers the maintenance state machine, schedule-overlap detection, all
use cases (business rules), the guards, the error filter and the response
interceptor — 198 tests, about 57% statement coverage. Controllers and TypeORM
repositories are not unit-tested; they were exercised end to end against a real
database. The `npm test` scripts already pass the Node flag that Jest needs for
NestJS's ES-module packages.

Quality checks:

```bash
npm run lint
npm run build
```

## Database migrations

The schema is managed only through TypeORM migrations (`synchronize` is never
used). Migration files live in `src/database/migrations/` and are committed.

```bash
npm run migration:generate --name=DescriptiveName   # after changing an ORM entity
npm run migration:run                               # apply pending migrations
npm run migration:revert                            # undo the last one
```

### SQL dump

`fleetcore_dump.sql` is a full PostgreSQL dump (schema plus the seeded demo
data) taken with `pg_dump`. Restore it into a **new, empty** database:

```bash
docker compose up -d postgres
docker compose exec postgres createdb -U postgres fleetcore_restored
docker compose exec -T postgres psql -U postgres -d fleetcore_restored < fleetcore_dump.sql
```

It contains the bcrypt hashes of the demo passwords above and is meant for demo
data only. It was made with PostgreSQL 16.14, whose `pg_dump` adds `\restrict`
lines: restoring through the Compose container (as above) always works, but an
older `psql` on your host may reject them — delete those two lines if so.

## Project structure

```
src/
├── domain-contracts/        Shared enums, repository ports, injection tokens
│   └── index.ts             The only cross-module import point (barrel file)
├── modules/
│   ├── auth/                Users, registration, login, JWT strategy, Google OAuth
│   ├── mechanics/           /mechanics — a filtered view of MECHANIC users
│   ├── vehicles/            /vehicles
│   ├── workshops/           /workshops
│   └── maintenances/        /maintenances, state machine, /external history
│       ├── domain/          Entities, value objects, domain exceptions (pure TS)
│       ├── application/     Use cases (one public execute()), DTOs, ports
│       ├── infrastructure/  TypeORM entities and repositories, adapters
│       └── interfaces/      Controllers, guards, decorators
├── shared/                  Cross-cutting pieces used by every module
│   ├── decorators/          @Roles(), @Public(), @CurrentUser()
│   ├── guards/              JwtAuthGuard, RolesGuard, ApiKeyGuard
│   ├── interceptors/        Success-response envelope
│   ├── filters/             Global exception filter (domain errors → HTTP codes)
│   └── swagger/             Documentation helpers
├── config/                  Data source (migrations CLI), env validation
├── database/
│   ├── migrations/          TypeORM migrations
│   └── seeders/             Idempotent seeder
├── app.module.ts
└── main.ts
```

**Architecture.** Clean Architecture with the dependency rule
`interfaces → infrastructure → application → domain`: `domain/` has no framework
imports, `application/` never imports `infrastructure/` (repositories are
injected through the ports and tokens in `domain-contracts`), and controllers
only call use cases. Business errors are domain exceptions that the global
exception filter maps to HTTP codes.

Modules never import each other's internal folders. What several modules share
lives in one of two places: `domain-contracts` (enums, repository ports and
tokens) or `shared/` (the auth decorators and guards, the response envelope, the
error filter). The only imports between modules are the `imports: [...]` entries
of the Nest `Module` classes that the stage specs require (`MechanicsModule` and
`MaintenancesModule` import the modules whose providers they consume).

## Troubleshooting

| Problem | Fix |
|---|---|
| `port is already allocated` on `docker compose up` | Set `API_HOST_PORT` / `DB_HOST_PORT` in `.env` to free ports |
| Local run cannot reach the database | `DB_PORT` must equal the port your database listens on (`DB_HOST_PORT` for the Compose database) |
| App exits with `Invalid environment configuration` | Fix the variable named in the message (see the table above) |
| `GET /auth/google` returns `503` | Google credentials are not configured — see [Google login](#google-login) |
| Want a clean database | `docker compose down -v`, then `docker compose up --build` and seed again |
