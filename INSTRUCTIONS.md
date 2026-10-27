# INSTRUCTIONS.md — Claude Code Operational Rules for FleetCore (car-fix-app)

> **Read this file BEFORE executing any stage from STAGES.md.**
> Every line of code you generate must comply with these rules. No exceptions.

---

## 1. Language & Naming

- **All code, comments, variable names, class names, enum values, error messages, README, and documentation must be in English.**
- Use `camelCase` for variables and functions.
- Use `PascalCase` for classes, interfaces, enums, and decorators.
- Use `UPPER_SNAKE_CASE` for enum values and constants.
- Use `kebab-case` for file names (e.g., `create-maintenance.use-case.ts`).
- Names must reveal intent. No abbreviations unless universally understood (`id`, `dto`, `jwt`).

---

## 2. Clean Architecture — Folder Structure

```
src/
├── domain-contracts/          # Shared ports, interfaces, enums across modules
│   ├── ports/                 # Abstract repository interfaces (e.g., IUserRepository)
│   ├── enums/                 # Shared enums (Role, VehicleStatus, etc.)
│   └── index.ts               # Barrel file — the ONLY cross-module import point
│
├── modules/
│   ├── auth/
│   │   ├── domain/            # Entities, value objects, domain exceptions
│   │   ├── application/       # Use cases (one public execute() per class)
│   │   │   ├── use-cases/
│   │   │   ├── ports/         # Module-internal port interfaces
│   │   │   └── dtos/
│   │   ├── infrastructure/    # TypeORM repos, external services, strategies
│   │   │   ├── persistence/
│   │   │   └── strategies/
│   │   └── interfaces/        # Controllers, decorators, guards, interceptors, filters
│   │       ├── controllers/
│   │       ├── decorators/
│   │       ├── guards/
│   │       └── filters/
│   │
│   ├── vehicles/              # Same 4-layer structure
│   ├── mechanics/             # Same 4-layer structure
│   ├── workshops/             # Same 4-layer structure
│   └── maintenances/          # Same 4-layer structure
│
├── shared/                    # Cross-cutting: interceptors, filters, pipes, base classes
│   ├── interceptors/
│   ├── filters/
│   └── pipes/
│
├── config/                    # TypeORM data-source config, env validation
├── database/
│   ├── seeders/
│   └── migrations/            # TypeORM auto-generated migration files
│
├── app.module.ts
└── main.ts
```

### Dependency Rule (STRICTLY ENFORCED)

```
interfaces → infrastructure → application → domain
```

- **domain/** — Pure TypeScript only. NO imports from `@nestjs/*`, `typeorm`, `express`, `bcrypt`, or any framework/library. Contains entities (plain classes), value objects, and domain-specific exceptions.
- **application/** — Use cases and DTOs. Depends ONLY on domain and ports (interfaces). NEVER imports from `infrastructure/`. Dependencies are injected via tokens.
- **infrastructure/** — TypeORM entities (decorated), repository implementations, external service adapters. Implements ports from `application/ports/`.
- **interfaces/** — Controllers, guards, decorators, filters. Calls use cases only — NEVER injects repositories directly.
- **Cross-module imports** — ONLY through `src/domain-contracts/`. Never import another module's internal folders.

---

## 3. SOLID Principles

### S — Single Responsibility
- Each use case has ONE public method: `execute(dto)`.
- Functions must be < 30 lines. If longer, extract.
- Controllers only call use cases. No business logic in controllers.

### O — Open/Closed
- New business rules via strategy or polymorphism, not `if-else` chains.
- State transitions in maintenances should use a clear transition map, not nested conditionals.

### L — Liskov Substitution
- Repository implementations must be substitutable. Contracts are defined in ports.

### I — Interface Segregation
- Small, focused interfaces in `domain-contracts/ports/`.
- Split readers from writers if an interface grows beyond 5 methods.

### D — Dependency Inversion
- `application/` and `domain/` depend on abstractions (ports), never on TypeORM or NestJS.
- Inject dependencies via NestJS tokens (`@Inject(USER_REPOSITORY)`).
- Define token constants in `domain-contracts/`.

---

## 4. Data Model — Single User Entity

There is ONE `users` table. Roles are `ADMIN` and `MECHANIC`.

- Users with role `MECHANIC` have additional fields: `specialty`, `isActive`.
- The `/mechanics` endpoints are a filtered view of users with `role = MECHANIC`.
- The `maintenances` table references `mechanicId` which is a `users.id` where `role = MECHANIC`.
- Auth endpoints (`/auth/register`, `/auth/login`) handle both roles.

### Entity Fields

**User:** id, name, email, password, role (ADMIN|MECHANIC), specialty (nullable), isActive, createdAt, updatedAt

**Vehicle:** id, plate (unique), brand, model, year, mileage, status (AVAILABLE|IN_MAINTENANCE|INACTIVE), createdAt, updatedAt

**Workshop:** id, name, address, isActive, createdAt, updatedAt

**Maintenance:** id, type (PREVENTIVE|CORRECTIVE), description, mileage, scheduledStartDate, scheduledEndDate, status (SCHEDULED|IN_PROGRESS|COMPLETED|CANCELLED), workPerformed (nullable), finalCost (nullable), finalMileage (nullable), finishedAt (nullable), vehicleId, mechanicId, workshopId, createdAt, updatedAt

---

## 5. Business Rules (Maintenance State Machine)

### Valid Transitions
```
SCHEDULED    → IN_PROGRESS | CANCELLED
IN_PROGRESS  → COMPLETED   | CANCELLED
COMPLETED    → (terminal — no further transitions)
CANCELLED    → (terminal — no further transitions)
```

### Side Effects
- `SCHEDULED → IN_PROGRESS`: Vehicle status → `IN_MAINTENANCE`
- `IN_PROGRESS → COMPLETED`: Vehicle status → `AVAILABLE`. Requires: workPerformed, finalCost, finishedAt, finalMileage.
- `→ CANCELLED`: If vehicle was `IN_MAINTENANCE`, set back to `AVAILABLE`.

### Validation Rules
- Cannot create maintenance for INACTIVE vehicle.
- Cannot assign inactive mechanic.
- Cannot assign inactive workshop.
- Vehicle cannot have more than one active maintenance (SCHEDULED or IN_PROGRESS).
- Mechanic schedule overlap check: no two active maintenances (SCHEDULED or IN_PROGRESS) with overlapping `[scheduledStartDate, scheduledEndDate)` ranges. Touching boundaries (end == start) are allowed.
- Maintenance mileage must be >= vehicle's current mileage.
- COMPLETED maintenance must include all closing fields.

---

## 6. API Response Format

### Success (applied by global interceptor)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "timestamp": "2026-10-20T19:00:00.000Z"
}
```

### Error (applied by global exception filter)
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Vehicle ABC123 already has an active maintenance",
  "path": "/maintenances",
  "timestamp": "2026-10-20T19:00:00.000Z"
}
```

- No business/validation/auth error should result in HTTP 500.
- Use appropriate HTTP codes: 400 (validation), 401 (no/invalid token), 403 (insufficient role), 404 (not found), 409 (conflict/business rule violation).

---

## 7. Auth & Security

- Passwords hashed with `bcrypt`.
- JWT signed with secret from env (`JWT_SECRET`), expiration from env (`JWT_EXPIRES_IN`).
- Three custom decorators minimum: `@Roles()`, `@CurrentUser()`, `@Public()`.
- `JwtAuthGuard` — validates JWT on all routes except `@Public()`.
- `RolesGuard` — checks user role matches `@Roles()`.
- `ApiKeyGuard` — validates `x-api-key` header against env `API_KEYS` (comma-separated). Used on at least one endpoint (vehicle history by plate for external integrations).
- `@Public()` marks endpoints that skip JWT validation (login, register).

---

## 8. Code Quality

- **Comments:** Add clear English comments in: guards, filters, interceptors, decorators, state transition logic, and overlap validation. Do NOT over-comment obvious code.
- **DTOs:** Use `class-validator` decorators. DTOs are immutable (no setters).
- **Error handling:** Domain exceptions (e.g., `InvalidStateTransitionException`) in `domain/`. Catch them in the global exception filter and map to HTTP codes.
- **No `any` type.** Strict TypeScript.
- **No barrel files inside modules** except `domain-contracts/index.ts`.

---

## 9. Testing (Jest + ts-jest)

- Use `ts-jest` transform. ESM import/export in source code, ts-jest handles compilation.
- Test files: `*.spec.ts` next to the file they test.
- Focus tests on: state machine transitions, schedule overlap validation, business rules.
- Target: >40% overall coverage.
- Use `--coverage` flag to verify.

---

## 10. TypeORM & Migrations

- **NEVER use `synchronize: true` in production or development.** Schema changes are managed exclusively through TypeORM migrations.
- Create a standalone `src/config/data-source.ts` file that exports the `DataSource` instance. This file is used by the TypeORM CLI for migration commands and also imported in `app.module.ts`.
- Configure the following npm scripts in `package.json`:
  ```json
  "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/config/data-source.ts",
  "migration:generate": "npm run typeorm -- migration:generate src/database/migrations/$npm_config_name",
  "migration:run": "npm run typeorm -- migration:run",
  "migration:revert": "npm run typeorm -- migration:revert"
  ```
- Install `tsconfig-paths` as a dev dependency for the CLI path resolution.
- **Workflow for every stage that adds or modifies an entity:**
  1. Create/update the ORM entity file (the `*.orm-entity.ts` in `infrastructure/persistence/`).
  2. Generate the migration: `npm run migration:generate --name=<DescriptiveName>` (e.g., `--name=CreateUsersTable`).
  3. Run the migration: `npm run migration:run`.
  4. Verify the migration is idempotent: running `migration:run` again should report no pending migrations.
- Migration files live in `src/database/migrations/` and are committed to version control.
- In `docker-compose.yml`, the API service entrypoint should run `npm run migration:run` before starting the app (or use a startup script).

---

## 11. Docker

- `Dockerfile`: Multi-stage build (builder + production).
- `docker-compose.yml`: API service + PostgreSQL service with volume for persistence and internal network.
- The API entrypoint must run `npm run migration:run` before `npm run start:prod` to apply pending migrations automatically.
- The app must start correctly with `docker-compose up`.

---

## 12. Seeders

- Run with: `npm run seed`
- Idempotent: running twice must NOT duplicate data. Use upsert or check-before-insert.
- Minimum seed data:
  - 1 ADMIN user, 2 MECHANIC users (active)
  - 1 inactive MECHANIC user
  - 2 workshops: 1 active, 1 inactive
  - 4 vehicles: 2 AVAILABLE, 1 IN_MAINTENANCE, 1 INACTIVE
  - The IN_MAINTENANCE vehicle must have a linked IN_PROGRESS maintenance
  - At least 1 COMPLETED maintenance for history

---

## 13. Swagger

- Use `@nestjs/swagger` with decorators on all controllers and DTOs.
- Document: summary, description, response types, auth requirements.
- Swagger UI available at `/api/docs`.

---

## 14. Environment Variables

File: `.env.example`
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=fleetcore
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=1h
API_KEYS=demo-key-partner-1,demo-key-partner-2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

---

## 15. Git Flow & Commit Guide

Branch model: `main` (production) ← `develop` (integration) ← `feat/stage-{N}-{short-description}` (one per stage).

After completing each stage, you MUST generate/update the file `GIT_GUIDE.md` in the project root with:
- The branch name to create, always from an up-to-date `develop` (format: `feat/stage-{N}-{short-description}`)
- The exact git commands to run (checkout, add, commit, push, PR, merge), all runnable from the CLI (`git` + `gh`)
- Commit messages following conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`
- If a stage produces multiple logical units, split into multiple commits
- Stage only the files of that stage, by explicit path. Never `git add .` or `git add -A`, and never stage whole top-level folders such as `node_modules/`, `dist/` or `coverage/`
- Every stage PR targets `develop`. Only `develop` is merged into `main`, once all stages are integrated and verified
- Remote repository: `https://github.com/Andres-1109/fleet-core`

Example entry in GIT_GUIDE.md:
```
## Stage 1 — Project Setup

### Branch
git checkout develop && git pull origin develop
git checkout -b feat/stage-1-project-setup

### Commits
git add package.json package-lock.json nest-cli.json tsconfig.json
git commit -m "chore: scaffold NestJS project"

### Push, PR into develop, merge
git push -u origin feat/stage-1-project-setup
gh pr create --base develop --head feat/stage-1-project-setup --title "..." --body "..."
gh pr merge feat/stage-1-project-setup --merge --delete-branch
git checkout develop && git pull origin develop
```

---

## 16. Stage Execution Protocol

1. Read `STAGES.md` and identify the current stage to execute.
2. Read this `INSTRUCTIONS.md` fully before writing any code.
3. Execute ONLY the current stage. Do not jump ahead.
4. After completing a stage, update `GIT_GUIDE.md` with the commit instructions.
5. Run `npm run lint` and `npm run build` before marking a stage as complete.
6. Report what was built, what files were created/modified, and any decisions made.
