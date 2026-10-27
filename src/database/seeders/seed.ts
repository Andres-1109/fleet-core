import { Logger } from '@nestjs/common';
import {
  DeepPartial,
  EntityManager,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import dataSource from '../../config/data-source';
import { MaintenanceStatus } from '../../domain-contracts';
import { UserOrmEntity } from '../../modules/auth/infrastructure/persistence/user.orm-entity';
import { BcryptPasswordHasher } from '../../modules/auth/infrastructure/services/bcrypt-password-hasher.service';
import { MaintenanceOrmEntity } from '../../modules/maintenances/infrastructure/persistence/maintenance.orm-entity';
import { VehicleOrmEntity } from '../../modules/vehicles/infrastructure/persistence/vehicle.orm-entity';
import { WorkshopOrmEntity } from '../../modules/workshops/infrastructure/persistence/workshop.orm-entity';
import {
  buildHistoryMaintenance,
  buildInProgressMaintenance,
  SEED_USERS,
  SEED_VEHICLES,
  SEED_WORKSHOPS,
} from './seed-data';

const logger = new Logger('Seeder');
const passwordHasher = new BcryptPasswordHasher();

/**
 * Check-before-insert: returns the existing row when `where` matches, otherwise
 * creates it. This is what makes the seeder idempotent; existing rows are never
 * modified, so manual changes to seeded records survive re-runs.
 */
async function findOrCreate<T extends ObjectLiteral>(
  repository: Repository<T>,
  label: string,
  where: FindOptionsWhere<T>,
  buildData: () => Promise<DeepPartial<T>> | DeepPartial<T>,
): Promise<T> {
  const existing = await repository.findOneBy(where);
  if (existing) {
    logger.log(`exists   ${label}`);
    return existing;
  }
  const created = await repository.save(repository.create(await buildData()));
  logger.log(`created  ${label}`);
  return created;
}

async function seedUsers(
  manager: EntityManager,
): Promise<Map<string, UserOrmEntity>> {
  const repository = manager.getRepository(UserOrmEntity);
  const usersByEmail = new Map<string, UserOrmEntity>();
  for (const seedUser of SEED_USERS) {
    const user = await findOrCreate(
      repository,
      `user ${seedUser.email}`,
      { email: seedUser.email },
      async () => ({
        ...seedUser,
        // Hash only when the user is actually created.
        password: await passwordHasher.hash(seedUser.password),
      }),
    );
    usersByEmail.set(user.email, user);
  }
  return usersByEmail;
}

async function seedWorkshops(
  manager: EntityManager,
): Promise<Map<string, WorkshopOrmEntity>> {
  const repository = manager.getRepository(WorkshopOrmEntity);
  const workshopsByName = new Map<string, WorkshopOrmEntity>();
  for (const seedWorkshop of SEED_WORKSHOPS) {
    const workshop = await findOrCreate(
      repository,
      `workshop ${seedWorkshop.name}`,
      { name: seedWorkshop.name },
      () => ({ ...seedWorkshop }),
    );
    workshopsByName.set(workshop.name, workshop);
  }
  return workshopsByName;
}

async function seedVehicles(
  manager: EntityManager,
): Promise<Map<string, VehicleOrmEntity>> {
  const repository = manager.getRepository(VehicleOrmEntity);
  const vehiclesByPlate = new Map<string, VehicleOrmEntity>();
  for (const seedVehicle of SEED_VEHICLES) {
    const vehicle = await findOrCreate(
      repository,
      `vehicle ${seedVehicle.plate}`,
      { plate: seedVehicle.plate },
      () => ({ ...seedVehicle }),
    );
    vehiclesByPlate.set(vehicle.plate, vehicle);
  }
  return vehiclesByPlate;
}

interface MaintenanceSeedContext {
  repository: Repository<MaintenanceOrmEntity>;
  now: Date;
  workshopId: string;
}

/**
 * One COMPLETED maintenance (history for ABC123) and one IN_PROGRESS
 * maintenance (the reason GHI789 is IN_MAINTENANCE). Both are matched by
 * vehicle + status, so a re-run finds them instead of inserting again.
 */
async function seedMaintenances(
  manager: EntityManager,
  users: Map<string, UserOrmEntity>,
  workshops: Map<string, WorkshopOrmEntity>,
  vehicles: Map<string, VehicleOrmEntity>,
): Promise<void> {
  const context: MaintenanceSeedContext = {
    repository: manager.getRepository(MaintenanceOrmEntity),
    now: new Date(),
    workshopId: requiredId(workshops.get('Central Workshop'), 'workshop'),
  };
  await seedHistoryMaintenance(
    context,
    requiredId(vehicles.get('ABC123'), 'vehicle ABC123'),
    requiredId(users.get('mechanic1@fleetcore.com'), 'mechanic1'),
  );
  await seedInProgressMaintenance(
    context,
    requiredId(vehicles.get('GHI789'), 'vehicle GHI789'),
    requiredId(users.get('mechanic2@fleetcore.com'), 'mechanic2'),
  );
}

function requiredId(entity: { id: string } | undefined, label: string): string {
  if (!entity) {
    throw new Error(`Seed prerequisite missing: ${label}`);
  }
  return entity.id;
}

async function seedHistoryMaintenance(
  { repository, now, workshopId }: MaintenanceSeedContext,
  vehicleId: string,
  mechanicId: string,
): Promise<void> {
  await findOrCreate(
    repository,
    'maintenance COMPLETED for ABC123',
    { vehicleId, status: MaintenanceStatus.COMPLETED },
    () => ({
      ...buildHistoryMaintenance(now),
      status: MaintenanceStatus.COMPLETED,
      vehicleId,
      mechanicId,
      workshopId,
    }),
  );
}

async function seedInProgressMaintenance(
  { repository, now, workshopId }: MaintenanceSeedContext,
  vehicleId: string,
  mechanicId: string,
): Promise<void> {
  await findOrCreate(
    repository,
    'maintenance IN_PROGRESS for GHI789',
    { vehicleId, status: MaintenanceStatus.IN_PROGRESS },
    () => ({
      ...buildInProgressMaintenance(now),
      status: MaintenanceStatus.IN_PROGRESS,
      vehicleId,
      mechanicId,
      workshopId,
    }),
  );
}

async function seed(): Promise<void> {
  await dataSource.initialize();
  try {
    // Make sure the schema is current before inserting anything.
    const applied = await dataSource.runMigrations();
    logger.log(`migrations applied: ${String(applied.length)}`);

    // All-or-nothing: a failure leaves the database exactly as it was.
    await dataSource.transaction(async (manager) => {
      const users = await seedUsers(manager);
      const workshops = await seedWorkshops(manager);
      const vehicles = await seedVehicles(manager);
      await seedMaintenances(manager, users, workshops, vehicles);
    });
    logger.log('Seeding finished');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  logger.error(
    'Seeding failed',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});
