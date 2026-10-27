# GIT_GUIDE.md — FleetCore

Remote repository: `https://github.com/Andres-1109/fleet-core`

Everything below is meant to be copied and pasted into a terminal, in order.
Everything is done from the CLI (`git` + `gh`), including pull requests and merges.

## Branch model

```
feat/stage-N-...  ──PR──▶  develop  ──PR (only when everything is integrated)──▶  main
```

- `main`: final, stable code. It only receives one PR, from `develop`, at the very end.
- `develop`: integration branch. Every stage PR targets it.
- `feat/stage-N-...`: one branch per stage, always created from an up-to-date `develop`.

## Rules (they prevent the "whole folders got committed" problem)

- Never run `git add .` or `git add -A`. Every staging command below lists explicit paths (`add_code` / `add_specs` are defined in 0.2).
- `.gitignore` already blocks `node_modules/`, `dist/`, `coverage/`, `.env`, `.qodo/` and `*.tsbuildinfo`.
- Before each commit, run `git status --short` and check that only that commit's files are staged.
- The project is already finished, so the stages are published one at a time from the
  working folder. Files of later stages stay untracked (and untouched) while you work.
- Intermediate stage branches do not build on their own (for example `app.module.ts` is
  only added in Stage 11, when every module it imports exists). Build and tests are
  verified on `develop` before the final PR to `main`.

---

## 0. One-time setup

### 0.1 Prerequisites and backup

```bash
cd ~/Andres                                   # the project folder
cp -r ~/Andres ~/Andres-backup                # safety copy (switching branches removes tracked files from the folder until they are merged)
rm -rf .git                                   # start from zero (skip if there is no .git)
gh auth login                                 # GitHub.com → HTTPS → login with browser
gh auth status
```

### 0.2 Staging helpers (paste once per terminal)

Plain `git add <folder>` also stages specs and anything else inside it, and git's `:(exclude)`
pathspecs silently stage nothing when combined (tested). These two helpers stage only real
files, by name, so a stage never picks up another stage's files:

```bash
# source files under the given folders: no *.spec.ts, no Google OAuth files (those ship in Stage 11)
add_code()  { find "$@" -type f ! -name '*.spec.ts' ! -name '*google*' ! -name '*oauth*' -print0 | xargs -0 git add --; }
# only the *.spec.ts files under the given folders
add_specs() { find "$@" -type f -name '*.spec.ts' -print0 | xargs -0 git add --; }
```

### 0.3 Local identity (this repo only, so the global git config is not touched)

```bash
git init -b main
git config user.name "Andres-1109"
git config user.email "felipe11092002@gmail.com"   # the email linked to your GitHub account
git remote add origin https://github.com/Andres-1109/fleet-core.git
```

### 0.4 Create the GitHub repository (skip if `fleet-core` already exists and is empty)

```bash
gh repo create Andres-1109/fleet-core --public --description "FleetCore API: vehicle maintenance management (NestJS, TypeORM, PostgreSQL)"
```

### 0.5 First commit on `main` and creation of `develop`

```bash
git status --short                            # the project files appear as untracked (??), none staged
git add .gitignore
git commit -m "chore: initialize repository with .gitignore"
git push -u origin main

git checkout -b develop
git push -u origin develop
gh repo edit Andres-1109/fleet-core --default-branch develop   # PRs and clones default to develop
```

---

## Stage 1 — Project scaffolding and configuration

```bash
git checkout develop && git pull origin develop
git checkout -b feat/stage-1-project-setup

git add package.json package-lock.json nest-cli.json tsconfig.json tsconfig.build.json eslint.config.mjs .prettierrc
git commit -m "chore: scaffold NestJS project with tooling and npm scripts"

git add src/config/data-source.ts src/config/environment.validation.ts .env.example
git commit -m "chore: configure TypeORM data source and environment validation"

git add Dockerfile docker-compose.yml .dockerignore
git commit -m "chore: add Dockerfile and docker-compose"

git add INSTRUCTIONS.md STAGES.md
git commit -m "docs: add project instructions and stage plan"

git status --short
git push -u origin feat/stage-1-project-setup
gh pr create --base develop --head feat/stage-1-project-setup \
  --title "Stage 1: project scaffolding and configuration" \
  --body "NestJS scaffold, TypeORM data source with migration scripts, environment validation, Docker and docker-compose. See STAGES.md, Stage 1."
gh pr merge feat/stage-1-project-setup --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 2 — Domain contracts and shared building blocks

```bash
git checkout -b feat/stage-2-domain-contracts

git add src/domain-contracts
git commit -m "feat: add domain contracts (enums, repository ports, tokens)"

add_code src/shared/exceptions src/shared/filters src/shared/interceptors src/shared/persistence src/shared/transformers src/shared/pipes
git commit -m "feat: add shared exception, response filter/interceptor, and persistence helpers"

add_code src/shared/decorators src/shared/guards
git commit -m "feat: add shared auth decorators and guards (JWT, roles, API key)"

git status --short
git push -u origin feat/stage-2-domain-contracts
gh pr create --base develop --head feat/stage-2-domain-contracts \
  --title "Stage 2: domain contracts and shared building blocks" \
  --body "Enums, repository ports, injection tokens, and the shared decorators, guards, filter and interceptor used by every module."
gh pr merge feat/stage-2-domain-contracts --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 3 — Auth module

The Google OAuth files and `auth.module.ts` / `auth.controller.ts` are published in Stage 11,
where the module is wired together.

```bash
git checkout -b feat/stage-3-auth-module

add_code src/modules/auth/domain src/modules/auth/application/ports src/modules/auth/application/dtos
git commit -m "feat: add auth domain entity, exceptions, ports, and DTOs"

add_code src/modules/auth/application/use-cases
git commit -m "feat: add register and login use cases"

add_code src/modules/auth/infrastructure src/modules/auth/interfaces/filters
git add src/database/migrations/*CreateUsersTable.ts
git commit -m "feat: add user persistence, bcrypt hasher, JWT service/strategy, and users migration"

git status --short
git push -u origin feat/stage-3-auth-module
gh pr create --base develop --head feat/stage-3-auth-module \
  --title "Stage 3: auth module" \
  --body "User entity, register/login use cases, bcrypt hasher, JWT service and strategy, users table migration."
gh pr merge feat/stage-3-auth-module --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 4 — Mechanics module

```bash
git checkout -b feat/stage-4-mechanics-module

add_code src/modules/mechanics/domain src/modules/mechanics/application
git commit -m "feat: add mechanics domain exceptions, DTOs, and use cases"

git add src/modules/mechanics/infrastructure src/modules/mechanics/interfaces src/modules/mechanics/mechanics.module.ts
git commit -m "feat: add mechanics controller and module"

git status --short
git push -u origin feat/stage-4-mechanics-module
gh pr create --base develop --head feat/stage-4-mechanics-module \
  --title "Stage 4: mechanics module" \
  --body "CRUD and activate/deactivate for MECHANIC users."
gh pr merge feat/stage-4-mechanics-module --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 5 — Vehicles module

```bash
git checkout -b feat/stage-5-vehicles-module

add_code src/modules/vehicles/domain src/modules/vehicles/application
git commit -m "feat: add vehicle entity, exceptions, DTOs, and use cases"

git add src/modules/vehicles/infrastructure src/modules/vehicles/interfaces src/modules/vehicles/vehicles.module.ts
git add src/database/migrations/*CreateVehiclesTable.ts
git commit -m "feat: add vehicle persistence, controller, module, and migration"

git status --short
git push -u origin feat/stage-5-vehicles-module
gh pr create --base develop --head feat/stage-5-vehicles-module \
  --title "Stage 5: vehicles module" \
  --body "Vehicle CRUD with unique plate, soft delete, and active-maintenance guard."
gh pr merge feat/stage-5-vehicles-module --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 6 — Workshops module

```bash
git checkout -b feat/stage-6-workshops-module

add_code src/modules/workshops/domain src/modules/workshops/application
git commit -m "feat: add workshop entity, DTOs, and use cases"

git add src/modules/workshops/infrastructure src/modules/workshops/interfaces src/modules/workshops/workshops.module.ts
git add src/database/migrations/*CreateWorkshopsTable.ts
git commit -m "feat: add workshop persistence, controller, module, and migration"

git status --short
git push -u origin feat/stage-6-workshops-module
gh pr create --base develop --head feat/stage-6-workshops-module \
  --title "Stage 6: workshops module" \
  --body "Workshop CRUD with activate/deactivate and filtered listing."
gh pr merge feat/stage-6-workshops-module --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 7 — Maintenances module

```bash
git checkout -b feat/stage-7-maintenances-module

add_code src/modules/maintenances/domain
git commit -m "feat: add maintenance entity, state machine, schedule range, and domain exceptions"

add_code src/modules/maintenances/application
git commit -m "feat: add maintenance DTOs and use cases"

git add src/modules/maintenances/infrastructure src/modules/maintenances/interfaces src/modules/maintenances/maintenances.module.ts
git add src/database/migrations/*CreateMaintenancesTable.ts
git commit -m "feat: add maintenance persistence, controllers, module, and migration"

git status --short
git push -u origin feat/stage-7-maintenances-module
gh pr create --base develop --head feat/stage-7-maintenances-module \
  --title "Stage 7: maintenances module" \
  --body "Maintenance scheduling with state machine, overlap and active-maintenance rules, role-based access, and vehicle history."
gh pr merge feat/stage-7-maintenances-module --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 8 — Seeders

```bash
git checkout -b feat/stage-8-seeders

git add src/database/seeders
git commit -m "feat: add database seeders with demo users, vehicles, workshops, and maintenances"

git status --short
git push -u origin feat/stage-8-seeders
gh pr create --base develop --head feat/stage-8-seeders \
  --title "Stage 8: seeders" \
  --body "Idempotent seeders for demo data (npm run seed / seed:prod)."
gh pr merge feat/stage-8-seeders --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 9 — Swagger documentation and application bootstrap

```bash
git checkout -b feat/stage-9-swagger

git add src/shared/swagger
git commit -m "docs: add Swagger envelope DTO and shared API response decorators"

git add src/main.ts
git commit -m "feat: add application bootstrap with global pipes, filter, interceptor, and Swagger"

git status --short
git push -u origin feat/stage-9-swagger
gh pr create --base develop --head feat/stage-9-swagger \
  --title "Stage 9: Swagger documentation" \
  --body "Swagger UI at /api/docs, shared response decorators, and application bootstrap."
gh pr merge feat/stage-9-swagger --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 10 — Unit tests

```bash
git checkout -b feat/stage-10-unit-tests

git add src/shared/testing
add_specs src/shared
git commit -m "test: add shared test helpers and unit tests for guards, filter, and interceptor"

add_specs src/modules/auth src/modules/mechanics src/modules/vehicles
git commit -m "test: add unit tests for auth, mechanics, and vehicles"

add_specs src/modules/workshops src/modules/maintenances
git commit -m "test: add unit tests for workshops and maintenances"

git status --short
git push -u origin feat/stage-10-unit-tests
gh pr create --base develop --head feat/stage-10-unit-tests \
  --title "Stage 10: unit tests" \
  --body "Jest unit tests for use cases, state machine, schedule range, guards, filter, and interceptor."
gh pr merge feat/stage-10-unit-tests --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 11 — Google OAuth 2.0 and module wiring

```bash
git checkout -b feat/stage-11-google-oauth

git add src/config/google-oauth.config.ts \
  src/modules/auth/application/dtos/google-profile.dto.ts \
  src/modules/auth/application/use-cases/login-with-google.use-case.ts \
  src/modules/auth/domain/google-email-not-verified.exception.ts \
  src/modules/auth/infrastructure/services/google-oauth-state.service.ts \
  src/modules/auth/infrastructure/strategies/google.strategy.ts \
  src/modules/auth/interfaces/guards/google-auth.guard.ts \
  src/modules/auth/interfaces/decorators/oauth-profile.decorator.ts
git commit -m "feat: add Google OAuth 2.0 strategy, state service, guard, and login use case"

git add src/modules/auth/auth.module.ts src/modules/auth/interfaces/controllers/auth.controller.ts src/app.module.ts
git commit -m "feat: add auth controller and module, and wire all modules in AppModule"

git status --short
git push -u origin feat/stage-11-google-oauth
gh pr create --base develop --head feat/stage-11-google-oauth \
  --title "Stage 11: Google OAuth 2.0" \
  --body "Google sign-in (state-protected), auth controller/module, and AppModule wiring."
gh pr merge feat/stage-11-google-oauth --merge --delete-branch
git checkout develop && git pull origin develop
```

## Stage 12 — Final polish and deliverables

```bash
git checkout -b feat/stage-12-final-polish

git add README.md
git commit -m "docs: add comprehensive README with setup instructions"

git add fleetcore_dump.sql
git commit -m "chore: add SQL dump file"

git add GIT_GUIDE.md
git commit -m "docs: add git guide with develop/main flow"

git status --short                            # must print nothing
git push -u origin feat/stage-12-final-polish
gh pr create --base develop --head feat/stage-12-final-polish \
  --title "Stage 12: final polish and deliverables" \
  --body "README, SQL dump, and git guide."
gh pr merge feat/stage-12-final-polish --merge --delete-branch
git checkout develop && git pull origin develop
```

---

## Verify `develop`, then release to `main`

Everything is integrated in `develop`. Check it from a clean clone before releasing:

```bash
cd /tmp && rm -rf fleet-core-check
git clone --branch develop https://github.com/Andres-1109/fleet-core.git fleet-core-check
cd fleet-core-check
cp .env.example .env
npm ci
npm run lint && npm run build && npm test
cd ~/Andres
```

If it is green, open and merge the only PR into `main`:

```bash
gh pr create --base main --head develop \
  --title "Release: FleetCore API (Stages 1-12)" \
  --body "Complete API: auth (JWT, roles, API key, Google OAuth), mechanics, vehicles, workshops, maintenances with state machine, seeders, Swagger, unit tests, Docker, README and SQL dump. All stages were integrated and verified in develop."
gh pr merge develop --merge                   # no --delete-branch: develop stays
git checkout main && git pull origin main
git checkout develop
```

Optional release tag:

```bash
git tag -a v1.0.0 -m "FleetCore API v1.0.0" main
git push origin v1.0.0
```

## Day-to-day flow for future changes

```bash
git checkout develop && git pull origin develop
git checkout -b feat/<short-description>
# ...edit...
git add <explicit paths>
git commit -m "feat: <what changed>"
git push -u origin feat/<short-description>
gh pr create --base develop --head feat/<short-description> --fill
gh pr merge feat/<short-description> --merge --delete-branch
git checkout develop && git pull origin develop
```

## Troubleshooting

- **A stage's files vanished from the folder**: they are tracked on a branch you left. Run
  `git checkout <that-branch>`, or restore from `~/Andres-backup`.
- **`add_code: command not found`**: paste the helpers from section 0.2 again (they live only in the current terminal).
- **`gh pr merge` says the PR is not mergeable**: run `git pull origin develop` on the stage
  branch, resolve conflicts, push again.
- **Remote repository has commits you do not have** (for example a README created on GitHub):
  `git pull origin main --allow-unrelated-histories` before the first push, or recreate the repo empty.
