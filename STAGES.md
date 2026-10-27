# STAGES.md — Sequential Build Plan for FleetCore (car-fix-app)

> **Before executing any stage, read `INSTRUCTIONS.md` completely.**
> Execute ONE stage at a time. After each stage, update `GIT_GUIDE.md`.

---

## Stage 1 — Project Scaffolding & Configuration

### Objective
Set up the NestJS project from scratch with Clean Architecture folder structure, Docker, and base configuration.

### Tasks
1. Initialize NestJS project with TypeScript (`@nestjs/cli`).
2. Install core dependencies:
   - `@nestjs/typeorm`, `typeorm`, `pg`
   - `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
   - `bcrypt`, `class-validator`, `class-transformer`
   - `@nestjs/swagger`, `swagger-ui-express`
   - `@nestjs/config`
   - `@types/bcrypt`, `@types/passport-jwt` (dev)
   - `ts-jest`, `@nestjs/testing` (dev)
3. Create the complete folder structure as defined in INSTRUCTIONS.md Section 2.
4. Configure `TypeOrmModule` in `app.module.ts` using `@nestjs/config` with env variables. **Set `synchronize: false`** — schema changes are managed via migrations only.
5. Create `src/config/data-source.ts` — standalone TypeORM `DataSource` for CLI migrations. Must read the same env variables.
6. Add migration npm scripts to `package.json`: `typeorm`, `migration:generate`, `migration:run`, `migration:revert` (see INSTRUCTIONS.md Section 10).
7. Install `tsconfig-paths` as a dev dependency.
8. Create `.env.example` with all required variables (see INSTRUCTIONS.md Section 14).
9. Create `.env` from `.env.example` with working local values.
10. Create `Dockerfile` (multi-stage: build + production). Entrypoint runs `npm run migration:run` before `npm run start:prod`.
11. Create `docker-compose.yml` (API + PostgreSQL with volume and internal network).
12. Configure ESLint and Prettier with strict TypeScript rules.
13. Configure Jest with `ts-jest` in `jest` section of `package.json` or `jest.config.ts`.
14. Create shared global interceptor (`ResponseInterceptor`) for uniform success responses.
15. Create shared global exception filter (`HttpExceptionFilter`) for uniform error responses.
16. Register the interceptor and filter globally in `main.ts`.
17. Configure Swagger in `main.ts` (title: "FleetCore API", path: `/api/docs`).
18. Add `ValidationPipe` globally with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
19. Create placeholder barrel file `src/domain-contracts/index.ts`.
20. Verify: `docker-compose up` starts both services, app connects to DB, Swagger is accessible.

### Deliverables
- Working NestJS app with Docker
- Clean Architecture folder skeleton
- Global interceptor + exception filter
- Swagger UI at `/api/docs`
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `chore: scaffold NestJS project with Clean Architecture folder structure`
2. `chore: configure TypeORM with migrations, data-source, and npm scripts`
3. `chore: configure Docker, environment, and global pipes/filters`
4. `docs: add .env.example`

---

## Stage 2 — Domain Contracts & Shared Enums

### Objective
Define all shared types, enums, port interfaces, and injection tokens used across modules.

### Tasks
1. Create enums in `src/domain-contracts/enums/`:
   - `role.enum.ts` → `ADMIN`, `MECHANIC`
   - `vehicle-status.enum.ts` → `AVAILABLE`, `IN_MAINTENANCE`, `INACTIVE`
   - `maintenance-type.enum.ts` → `PREVENTIVE`, `CORRECTIVE`
   - `maintenance-status.enum.ts` → `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
2. Create port interfaces in `src/domain-contracts/ports/`:
   - `user-repository.port.ts` → `IUserRepository`
   - `vehicle-repository.port.ts` → `IVehicleRepository`
   - `workshop-repository.port.ts` → `IWorkshopRepository`
   - `maintenance-repository.port.ts` → `IMaintenanceRepository`
3. Define injection token constants in `src/domain-contracts/tokens.ts`:
   - `USER_REPOSITORY`, `VEHICLE_REPOSITORY`, `WORKSHOP_REPOSITORY`, `MAINTENANCE_REPOSITORY`
4. Export everything from `src/domain-contracts/index.ts`.

### Deliverables
- All shared contracts defined and exported
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `feat: define shared enums and repository port interfaces`

---

## Stage 3 — Auth Module (Registration, Login, JWT, Guards, Decorators

### Objective
Build the complete authentication and authorization system.

### Tasks
1. **Domain layer** (`modules/auth/domain/`):
   - `user.entity.ts` — Plain class (NO decorators): id, name, email, password, role, specialty, isActive, createdAt, updatedAt.
   - `invalid-credentials.exception.ts` — Domain exception.
   - `user-already-exists.exception.ts` — Domain exception.

2. **Application layer** (`modules/auth/application/`):
   - `dtos/register-user.dto.ts` — Validated with class-validator: name, email, password, role, specialty (required if MECHANIC).
   - `dtos/login-user.dto.ts` — email, password.
   - `ports/user-repository.port.ts` — Module-level port (can re-export from domain-contracts or keep local).
   - `use-cases/register-user.use-case.ts` — Hashes password, checks uniqueness, saves user.
   - `use-cases/login-user.use-case.ts` — Validates credentials, returns JWT.

3. **Infrastructure layer** (`modules/auth/infrastructure/`):
   - `persistence/user.orm-entity.ts` — TypeORM entity with decorators, maps to `users` table.
   - `persistence/user-typeorm.repository.ts` — Implements `IUserRepository`.
   - `strategies/jwt.strategy.ts` — Passport JWT strategy.

4. **Interfaces layer** (`modules/auth/interfaces/`):
   - `controllers/auth.controller.ts` — `POST /auth/register`, `POST /auth/login`. Both `@Public()`.
   - `decorators/roles.decorator.ts` — `@Roles(...roles)` sets metadata.
   - `decorators/current-user.decorator.ts` — `@CurrentUser()` extracts user from request.
   - `decorators/public.decorator.ts` — `@Public()` marks route as public.
   - `guards/jwt-auth.guard.ts` — Global guard, skips `@Public()` routes.
   - `guards/roles.guard.ts` — Checks `@Roles()` metadata against user role.
   - `guards/api-key.guard.ts` — Validates `x-api-key` header against env `API_KEYS`.

5. **auth.module.ts** — Wire everything: providers, exports, JwtModule config.
6. Register `JwtAuthGuard` as global guard in `app.module.ts`.
7. **Generate migration:** `npm run migration:generate --name=CreateUsersTable`
8. **Run migration:** `npm run migration:run`
9. Verify: register → login → access protected route → 401 without token → 403 wrong role.

### Deliverables
- Full auth flow working
- 3 custom decorators
- 3 guards (JWT, Roles, ApiKey)
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `feat: add User domain entity and auth domain exceptions`
2. `feat: implement register and login use cases`
3. `feat: add JWT strategy, guards, and custom decorators`
4. `feat: wire auth module with controller endpoints`
5. `chore: add migration for users table`

---

## Stage 4 — Mechanics Module (MECHANIC Users CRUD)

### Objective
Expose CRUD endpoints for managing users with `role = MECHANIC`.

### Tasks
1. **Application layer** (`modules/mechanics/application/`):
   - `dtos/`: `create-mechanic.dto.ts`, `update-mechanic.dto.ts`.
   - `use-cases/`: `create-mechanic.use-case.ts`, `find-all-mechanics.use-case.ts`, `find-one-mechanic.use-case.ts`, `update-mechanic.use-case.ts`, `toggle-mechanic-status.use-case.ts`.

2. **Interfaces layer** (`modules/mechanics/interfaces/`):
   - `controllers/mechanics.controller.ts`:
     - `GET /mechanics` — List all mechanics (ADMIN).
     - `GET /mechanics/:id` — Get mechanic by ID (ADMIN).
     - `POST /mechanics` — Create mechanic (ADMIN). Internally creates user with role=MECHANIC.
     - `PATCH /mechanics/:id` — Update mechanic info (ADMIN).
     - `PATCH /mechanics/:id/status` — Toggle active/inactive (ADMIN).

3. **mechanics.module.ts** — Imports AuthModule for repository access (or re-uses the same IUserRepository port).
4. Creating a mechanic via `/mechanics` is essentially registering a user with `role = MECHANIC` and generating a hashed default password or requiring one in the DTO.
5. Verify: full CRUD operations, inactive mechanic cannot be assigned later.

### Deliverables
- Working `/mechanics` endpoints
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `feat: add mechanics module with CRUD use cases`
2. `feat: add mechanics controller and DTOs`

---

## Stage 5 — Vehicles Module

### Objective
Full vehicle management with status control and soft delete.

### Tasks
1. **Domain layer** (`modules/vehicles/domain/`):
   - `vehicle.entity.ts` — Plain class.
   - `duplicate-plate.exception.ts`
   - `inactive-vehicle.exception.ts`

2. **Application layer** (`modules/vehicles/application/`):
   - `dtos/`: `create-vehicle.dto.ts`, `update-vehicle.dto.ts`.
   - `use-cases/`: `create-vehicle.use-case.ts`, `find-all-vehicles.use-case.ts`, `find-vehicle.use-case.ts` (by ID or plate), `update-vehicle.use-case.ts`, `deactivate-vehicle.use-case.ts`.

3. **Infrastructure layer** (`modules/vehicles/infrastructure/`):
   - `persistence/vehicle.orm-entity.ts` — TypeORM entity. Unique constraint on `plate`.
   - `persistence/vehicle-typeorm.repository.ts` — Implements `IVehicleRepository`.

4. **Interfaces layer** (`modules/vehicles/interfaces/`):
   - `controllers/vehicles.controller.ts`:
     - `GET /vehicles` — List vehicles (ADMIN, MECHANIC).
     - `GET /vehicles/:identifier` — Get by ID or plate (ADMIN, MECHANIC).
     - `POST /vehicles` — Create (ADMIN).
     - `PATCH /vehicles/:id` — Update (ADMIN).
     - `DELETE /vehicles/:id` — Logical deactivation: sets status to INACTIVE (ADMIN).

5. **vehicles.module.ts**
6. **Generate migration:** `npm run migration:generate --name=CreateVehiclesTable`
7. **Run migration:** `npm run migration:run`
8. Verify: plate uniqueness, status transitions, logical deletion.

### Deliverables
- Working `/vehicles` endpoints
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `feat: add vehicle domain entity and exceptions`
2. `feat: implement vehicle CRUD use cases and repository`
3. `feat: add vehicles controller with validation`
4. `chore: add migration for vehicles table`

---

## Stage 6 — Workshops Module

### Objective
Workshop management with activation/deactivation.

### Tasks
1. **Domain layer** (`modules/workshops/domain/`):
   - `workshop.entity.ts` — Plain class.

2. **Application layer** (`modules/workshops/application/`):
   - `dtos/`: `create-workshop.dto.ts`, `update-workshop.dto.ts`.
   - `use-cases/`: `create-workshop.use-case.ts`, `find-all-workshops.use-case.ts`, `find-one-workshop.use-case.ts`, `update-workshop.use-case.ts`, `toggle-workshop-status.use-case.ts`.

3. **Infrastructure layer** (`modules/workshops/infrastructure/`):
   - `persistence/workshop.orm-entity.ts`
   - `persistence/workshop-typeorm.repository.ts`

4. **Interfaces layer** (`modules/workshops/interfaces/`):
   - `controllers/workshops.controller.ts`:
     - `GET /workshops` — List active workshops (ADMIN, MECHANIC).
     - `GET /workshops/:id` — Get by ID (ADMIN, MECHANIC).
     - `POST /workshops` — Create (ADMIN).
     - `PATCH /workshops/:id` — Update (ADMIN).
     - `PATCH /workshops/:id/status` — Toggle active/inactive (ADMIN).

5. **workshops.module.ts**
6. **Generate migration:** `npm run migration:generate --name=CreateWorkshopsTable`
7. **Run migration:** `npm run migration:run`
8. Verify: CRUD operations, status toggle.

### Deliverables
- Working `/workshops` endpoints
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `feat: add workshops module with full CRUD`
2. `chore: add migration for workshops table`

---

## Stage 7 — Maintenances Module (Core Business Logic)

### Objective
The most complex module. Maintenance CRUD with state machine, business rule validation, schedule overlap checking, and vehicle status synchronization.

### Tasks
1. **Domain layer** (`modules/maintenances/domain/`):
   - `maintenance.entity.ts` — Plain class.
   - `invalid-state-transition.exception.ts`
   - `schedule-overlap.exception.ts`
   - `vehicle-has-active-maintenance.exception.ts`
   - `maintenance-state-machine.ts` — Pure function/class defining valid transitions and side effects. No framework imports.

2. **Application layer** (`modules/maintenances/application/`):
   - `dtos/`:
     - `create-maintenance.dto.ts` — vehicleId, mechanicId, workshopId, type, description, mileage, scheduledStartDate, scheduledEndDate.
     - `update-maintenance-status.dto.ts` — status, workPerformed?, finalCost?, finalMileage?, finishedAt?.
   - `use-cases/`:
     - `create-maintenance.use-case.ts` — Validates all business rules, checks overlap, creates maintenance.
     - `update-maintenance-status.use-case.ts` — Validates transition, applies side effects (vehicle status), validates closing fields if COMPLETED. **Use a transaction** for status + vehicle update.
     - `find-all-maintenances.use-case.ts` — All maintenances with filters.
     - `find-active-maintenances.use-case.ts`
     - `find-maintenances-by-vehicle.use-case.ts`
     - `find-maintenances-by-mechanic.use-case.ts`
     - `find-vehicle-history.use-case.ts` — Full history for a vehicle (used by x-api-key endpoint too).

3. **Infrastructure layer** (`modules/maintenances/infrastructure/`):
   - `persistence/maintenance.orm-entity.ts` — Relations to Vehicle, User (mechanic), Workshop.
   - `persistence/maintenance-typeorm.repository.ts` — Implements `IMaintenanceRepository`. Includes overlap query method.

4. **Interfaces layer** (`modules/maintenances/interfaces/`):
   - `controllers/maintenances.controller.ts`:
     - `POST /maintenances` — Create (ADMIN).
     - `GET /maintenances` — List all (ADMIN).
     - `GET /maintenances/active` — Active only (ADMIN, MECHANIC).
     - `GET /maintenances/vehicle/:vehicleId` — By vehicle (ADMIN).
     - `GET /maintenances/mechanic/:mechanicId` — By mechanic (ADMIN, MECHANIC — MECHANIC only sees own).
     - `PATCH /maintenances/:id/status` — Update status (ADMIN, MECHANIC — MECHANIC only updates own assigned).
   - `controllers/vehicle-history.controller.ts`:
     - `GET /external/vehicles/:plate/history` — Protected by `ApiKeyGuard`. Returns vehicle info + maintenance history. This is the x-api-key endpoint.

5. **Schedule Overlap Logic** (in use-case or domain service):
   - Query all active maintenances (SCHEDULED | IN_PROGRESS) for the given mechanic.
   - Check if `[newStart, newEnd)` overlaps with any existing `[existingStart, existingEnd)`.
   - Overlap condition: `newStart < existingEnd AND newEnd > existingStart`.
   - Touching boundaries allowed: `newStart == existingEnd` is OK.

6. **maintenances.module.ts** — Import VehiclesModule, AuthModule (for mechanic/user repo), WorkshopsModule.
7. **Generate migration:** `npm run migration:generate --name=CreateMaintenancesTable`
8. **Run migration:** `npm run migration:run`
9. Verify: ALL business rules from INSTRUCTIONS.md Section 5.

### Deliverables
- Full maintenance lifecycle working
- All business rules enforced
- x-api-key endpoint
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `feat: add maintenance domain entities, state machine, and exceptions`
2. `feat: implement create-maintenance use case with overlap validation`
3. `feat: implement update-maintenance-status use case with transactions`
4. `feat: add maintenance query use cases (active, by vehicle, by mechanic)`
5. `feat: add vehicle history endpoint with x-api-key guard`
6. `feat: wire maintenances module and controller`
7. `chore: add migration for maintenances table`

---

## Stage 8 — Seeders

### Objective
Populate the database with test data. Idempotent execution.

### Tasks
1. Create `src/database/seeders/seed.ts`:
   - 1 ADMIN user (email: `admin@fleetcore.com`, password: `Admin123!`)
   - 2 active MECHANIC users (email: `mechanic1@fleetcore.com`, `mechanic2@fleetcore.com`)
   - 1 inactive MECHANIC user (email: `mechanic3@fleetcore.com`)
   - 2 workshops: 1 active ("Central Workshop"), 1 inactive ("North Workshop")
   - 4 vehicles:
     - 2 AVAILABLE (plates: `ABC123`, `DEF456`)
     - 1 IN_MAINTENANCE (plate: `GHI789`) — with linked IN_PROGRESS maintenance
     - 1 INACTIVE (plate: `JKL012`)
   - 1 COMPLETED maintenance for vehicle `ABC123` (for history)
2. Use upsert or findOne-then-create pattern. Running twice must NOT duplicate.
3. Add script to `package.json`: `"seed": "ts-node -r tsconfig-paths/register src/database/seeders/seed.ts"` (uses the same `DataSource` from `src/config/data-source.ts`).
4. The seeder must call `dataSource.runMigrations()` before inserting data to ensure the schema is up to date.
5. Verify: run `npm run seed` twice, check no duplicates.

### Deliverables
- Working idempotent seeder
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `feat: add database seeder with idempotent execution`

---

## Stage 9 — Swagger Documentation

### Objective
Complete API documentation with all endpoints, DTOs, and auth requirements.

### Tasks
1. Add `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()` to ALL controllers.
2. Add `@ApiProperty()` to ALL DTOs.
3. Add `@ApiBearerAuth()` to protected endpoints.
4. Add `@ApiSecurity('x-api-key')` to the vehicle history endpoint.
5. Group by tags: Auth, Mechanics, Vehicles, Workshops, Maintenances, External.
6. Verify: all endpoints visible and testable in Swagger UI at `/api/docs`.

### Deliverables
- Complete Swagger documentation
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `docs: add Swagger decorators to all controllers and DTOs`

---

## Stage 10 — Unit Tests (Jest)

### Objective
Test critical business logic. Target >40% coverage.

### Tasks
1. Test `maintenance-state-machine.ts`:
   - Valid transitions: SCHEDULED→IN_PROGRESS, IN_PROGRESS→COMPLETED, etc.
   - Invalid transitions: COMPLETED→IN_PROGRESS, CANCELLED→COMPLETED, etc.
2. Test `create-maintenance.use-case.ts`:
   - Rejects inactive vehicle.
   - Rejects inactive mechanic.
   - Rejects inactive workshop.
   - Rejects overlapping schedules.
   - Rejects mileage below vehicle's current mileage.
   - Rejects if vehicle has active maintenance.
3. Test `update-maintenance-status.use-case.ts`:
   - COMPLETED requires closing fields.
   - Vehicle status updates on transition.
4. Use mocked repositories (in-memory implementations or jest mocks).
5. Run: `npm run test -- --coverage` and verify >40%.

### Deliverables
- Test files covering core business rules
- Coverage report >40%
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `test: add unit tests for maintenance state machine`
2. `test: add unit tests for create and update maintenance use cases`

---

## Stage 11 — Google OAuth 2.0

### Objective
Allow login via Google, integrating the user into the system with a valid JWT.

### Tasks
1. Install: `@nestjs/passport`, `passport-google-oauth20`, `@types/passport-google-oauth20`.
2. Create `google.strategy.ts` in `modules/auth/infrastructure/strategies/`.
3. Add endpoints:
   - `GET /auth/google` — Redirects to Google login.
   - `GET /auth/google/callback` — Handles callback, creates/finds user, returns JWT.
4. If the Google user doesn't exist, create them with role `MECHANIC` by default (or allow role selection).
5. Env variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.
6. Verify: Google login flow returns valid JWT that works with protected endpoints.

### Deliverables
- Google OAuth working end-to-end
- `GIT_GUIDE.md` updated

### Suggested Commits
1. `feat: add Google OAuth 2.0 authentication strategy`

---

## Stage 12 — Final Polish & Deliverables

### Objective
Prepare all final deliverables for submission.

### Tasks
1. Write comprehensive `README.md`:
   - Project title and description.
   - Coder info (name and clan).
   - Tech stack.
   - Prerequisites.
   - Step-by-step installation guide.
   - How to run with Docker.
   - How to run locally (without Docker).
   - How to run seeders.
   - Test credentials (from seeder).
   - Swagger URL.
   - How to run tests.
   - Project structure overview.
   - API endpoints summary table.
2. Generate SQL dump: `pg_dump -U postgres fleetcore > fleetcore_dump.sql`
3. Final code review:
   - No `console.log` left in production code.
   - All error messages are descriptive English.
   - No TODO comments remaining.
   - Lint passes: `npm run lint`.
   - Build passes: `npm run build`.
   - All tests pass: `npm run test`.
4. Verify Docker: `docker-compose down && docker-compose up --build` → migrations run automatically, app starts, seed works, all endpoints respond.
5. Final `GIT_GUIDE.md` update.

### Deliverables
- Complete README.md
- SQL dump file
- Clean, documented codebase
- All tests passing
- Docker working
- Final `GIT_GUIDE.md`

### Suggested Commits
1. `docs: add comprehensive README with setup instructions`
2. `chore: add SQL dump file`
3. `chore: final code cleanup and lint fixes`

---

## Execution Checklist

| Stage | Description                    | Status |
|-------|--------------------------------|--------|
| 1     | Project Scaffolding            | [x]    |
| 2     | Domain Contracts & Enums       | [x]    |
| 3     | Auth Module                    | [x]    |
| 4     | Mechanics Module               | [x]    |
| 5     | Vehicles Module                | [x]    |
| 6     | Workshops Module               | [x]    |
| 7     | Maintenances Module            | [x]    |
| 8     | Seeders                        | [x]    |
| 9     | Swagger Documentation          | [x]    |
| 10    | Unit Tests                     | [x]    |
| 11    | Google OAuth 2.0               | [x]    |
| 12    | Final Polish & Deliverables    | [x]    |
