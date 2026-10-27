import {
  IMaintenanceRepository,
  IUserRepository,
  IVehicleRepository,
  IWorkshopRepository,
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
  Role,
  UserRecord,
  VehicleRecord,
  VehicleStatus,
  WorkshopRecord,
  IPasswordHasher,
} from '../../domain-contracts';

// Test-only record builders and port mocks shared by every module's specs.

const CREATED_AT = new Date('2026-01-01T00:00:00Z');

export const VEHICLE_ID = 'vehicle-1';
export const MECHANIC_ID = 'mechanic-1';
export const OTHER_MECHANIC_ID = 'mechanic-2';
export const WORKSHOP_ID = 'workshop-1';
export const MAINTENANCE_ID = 'maintenance-1';

export function buildVehicle(
  overrides: Partial<VehicleRecord> = {},
): VehicleRecord {
  return {
    id: VEHICLE_ID,
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2021,
    mileage: 1000,
    status: VehicleStatus.AVAILABLE,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

export function buildMechanic(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: MECHANIC_ID,
    name: 'Carlos Mechanic',
    email: 'carlos@fleetcore.com',
    password: 'hashed',
    role: Role.MECHANIC,
    specialty: 'Engines',
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

export function buildWorkshop(
  overrides: Partial<WorkshopRecord> = {},
): WorkshopRecord {
  return {
    id: WORKSHOP_ID,
    name: 'Central Workshop',
    address: 'Calle 10',
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

export function buildMaintenance(
  overrides: Partial<MaintenanceRecord> = {},
): MaintenanceRecord {
  return {
    id: MAINTENANCE_ID,
    type: MaintenanceType.PREVENTIVE,
    description: 'Oil change',
    mileage: 1000,
    scheduledStartDate: new Date('2026-11-10T10:00:00Z'),
    scheduledEndDate: new Date('2026-11-10T12:00:00Z'),
    status: MaintenanceStatus.SCHEDULED,
    workPerformed: null,
    finalCost: null,
    finalMileage: null,
    finishedAt: null,
    vehicleId: VEHICLE_ID,
    mechanicId: MECHANIC_ID,
    workshopId: WORKSHOP_ID,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

export function mockMaintenanceRepository(): jest.Mocked<IMaintenanceRepository> {
  return {
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    findActive: jest.fn().mockResolvedValue([]),
    findByVehicle: jest.fn().mockResolvedValue([]),
    findByMechanic: jest.fn().mockResolvedValue([]),
    findActiveByVehicle: jest.fn().mockResolvedValue(null),
    findActiveByMechanic: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    updateStatus: jest.fn(),
  };
}

export function mockVehicleRepository(): jest.Mocked<IVehicleRepository> {
  return {
    findById: jest.fn().mockResolvedValue(null),
    findByPlate: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
  };
}

export function mockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn().mockResolvedValue(null),
    findByEmail: jest.fn().mockResolvedValue(null),
    findAllByRole: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
  };
}

export function mockWorkshopRepository(): jest.Mocked<IWorkshopRepository> {
  return {
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
  };
}

export function mockPasswordHasher(): jest.Mocked<IPasswordHasher> {
  return {
    hash: jest.fn((plain: string) => Promise.resolve(`hashed:${plain}`)),
    compare: jest.fn((plain: string, hash: string) =>
      Promise.resolve(hash === `hashed:${plain}`),
    ),
  };
}
