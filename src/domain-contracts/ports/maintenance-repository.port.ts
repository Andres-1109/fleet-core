import { MaintenanceStatus } from '../enums/maintenance-status.enum';
import { MaintenanceType } from '../enums/maintenance-type.enum';
import { VehicleStatus } from '../enums/vehicle-status.enum';

/** Persisted shape of a maintenance, shared across modules. */
export interface MaintenanceRecord {
  id: string;
  type: MaintenanceType;
  description: string;
  mileage: number;
  scheduledStartDate: Date;
  scheduledEndDate: Date;
  status: MaintenanceStatus;
  workPerformed: string | null;
  finalCost: number | null;
  finalMileage: number | null;
  finishedAt: Date | null;
  vehicleId: string;
  mechanicId: string;
  workshopId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateMaintenanceData = Pick<
  MaintenanceRecord,
  | 'type'
  | 'description'
  | 'mileage'
  | 'scheduledStartDate'
  | 'scheduledEndDate'
  | 'vehicleId'
  | 'mechanicId'
  | 'workshopId'
>;

/** Fields that may change when a maintenance moves to a new status. */
export type MaintenanceStatusChange = Pick<
  Partial<MaintenanceRecord>,
  'workPerformed' | 'finalCost' | 'finalMileage' | 'finishedAt'
> & { status: MaintenanceStatus };

export interface MaintenanceFilter {
  status?: MaintenanceStatus;
  type?: MaintenanceType;
  vehicleId?: string;
  mechanicId?: string;
  workshopId?: string;
}

/** Vehicle changes applied in the same transaction as a status change. */
export interface VehicleStatusSync {
  vehicleId: string;
  status: VehicleStatus;
  mileage?: number;
}

export interface StatusUpdateCommand {
  id: string;
  /** Status the caller validated against; the update is skipped if it changed. */
  expectedStatus: MaintenanceStatus;
  change: MaintenanceStatusChange;
  vehicleSync: VehicleStatusSync | null;
}

export interface IMaintenanceReader {
  findById(id: string): Promise<MaintenanceRecord | null>;
  findAll(filter?: MaintenanceFilter): Promise<MaintenanceRecord[]>;
  /** Maintenances in SCHEDULED or IN_PROGRESS status. */
  findActive(): Promise<MaintenanceRecord[]>;
  findByVehicle(vehicleId: string): Promise<MaintenanceRecord[]>;
  findByMechanic(mechanicId: string): Promise<MaintenanceRecord[]>;
  /** The vehicle's SCHEDULED or IN_PROGRESS maintenance, if any. */
  findActiveByVehicle(vehicleId: string): Promise<MaintenanceRecord | null>;
  /** The mechanic's SCHEDULED or IN_PROGRESS maintenances (schedule checks). */
  findActiveByMechanic(mechanicId: string): Promise<MaintenanceRecord[]>;
}

export interface IMaintenanceWriter {
  create(data: CreateMaintenanceData): Promise<MaintenanceRecord>;
  /**
   * Applies the status change and the vehicle side effect atomically (single
   * transaction). Returns null, writing nothing, when the maintenance is no
   * longer in `expectedStatus` (a concurrent request changed it first).
   */
  updateStatus(command: StatusUpdateCommand): Promise<MaintenanceRecord | null>;
}

export type IMaintenanceRepository = IMaintenanceReader & IMaintenanceWriter;
