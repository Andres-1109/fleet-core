import { MaintenanceType, Role, VehicleStatus } from '../../domain-contracts';

/** Credentials documented in the README; change them before any real deployment. */
export const ADMIN_PASSWORD = 'Admin123!';
export const MECHANIC_PASSWORD = 'Mechanic123!';

export const SEED_USERS = [
  {
    name: 'Fleet Admin',
    email: 'admin@fleetcore.com',
    password: ADMIN_PASSWORD,
    role: Role.ADMIN,
    specialty: null,
    isActive: true,
  },
  {
    name: 'Carlos Mechanic',
    email: 'mechanic1@fleetcore.com',
    password: MECHANIC_PASSWORD,
    role: Role.MECHANIC,
    specialty: 'Engines',
    isActive: true,
  },
  {
    name: 'Laura Mechanic',
    email: 'mechanic2@fleetcore.com',
    password: MECHANIC_PASSWORD,
    role: Role.MECHANIC,
    specialty: 'Brakes and suspension',
    isActive: true,
  },
  {
    name: 'Mario Mechanic',
    email: 'mechanic3@fleetcore.com',
    password: MECHANIC_PASSWORD,
    role: Role.MECHANIC,
    specialty: 'Electrical systems',
    isActive: false,
  },
] as const;

export const SEED_WORKSHOPS = [
  {
    name: 'Central Workshop',
    address: 'Calle 10 # 5-20, Bogota',
    isActive: true,
  },
  {
    name: 'North Workshop',
    address: 'Carrera 15 # 100-45, Bogota',
    isActive: false,
  },
] as const;

export const SEED_VEHICLES = [
  {
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2021,
    mileage: 45300,
    status: VehicleStatus.AVAILABLE,
  },
  {
    plate: 'DEF456',
    brand: 'Ford',
    model: 'Ranger',
    year: 2022,
    mileage: 28000,
    status: VehicleStatus.AVAILABLE,
  },
  {
    plate: 'GHI789',
    brand: 'Mazda',
    model: 'BT-50',
    year: 2020,
    mileage: 78000,
    status: VehicleStatus.IN_MAINTENANCE,
  },
  {
    plate: 'JKL012',
    brand: 'Kia',
    model: 'Rio',
    year: 2018,
    mileage: 120500,
    status: VehicleStatus.INACTIVE,
  },
] as const;

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

/**
 * Maintenance dates are relative to the first seeding run, so the demo data
 * always looks current. Existing rows are never rewritten on later runs.
 */
export function buildHistoryMaintenance(now: Date): {
  type: MaintenanceType;
  description: string;
  mileage: number;
  scheduledStartDate: Date;
  scheduledEndDate: Date;
  workPerformed: string;
  finalCost: number;
  finalMileage: number;
  finishedAt: Date;
} {
  const start = new Date(now.getTime() - 14 * DAY_IN_MS);
  const end = new Date(start.getTime() + 3 * HOUR_IN_MS);
  return {
    type: MaintenanceType.PREVENTIVE,
    description: 'Scheduled 45,000 km service',
    mileage: 45000,
    scheduledStartDate: start,
    scheduledEndDate: end,
    workPerformed: 'Engine oil and filter change, brake inspection',
    finalCost: 185.5,
    finalMileage: 45300,
    finishedAt: new Date(end.getTime() - 20 * 60 * 1000),
  };
}

export function buildInProgressMaintenance(now: Date): {
  type: MaintenanceType;
  description: string;
  mileage: number;
  scheduledStartDate: Date;
  scheduledEndDate: Date;
} {
  return {
    type: MaintenanceType.CORRECTIVE,
    description: 'Replace worn front brake pads and discs',
    mileage: 78000,
    scheduledStartDate: new Date(now.getTime() - 2 * HOUR_IN_MS),
    scheduledEndDate: new Date(now.getTime() + 6 * HOUR_IN_MS),
  };
}
