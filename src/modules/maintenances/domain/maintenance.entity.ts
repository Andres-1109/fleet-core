import {
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
} from '../../../domain-contracts';
import { ScheduleRange } from './schedule-range';

/** Statuses that occupy a vehicle and a mechanic's schedule. */
export const ACTIVE_MAINTENANCE_STATUSES: readonly MaintenanceStatus[] = [
  MaintenanceStatus.SCHEDULED,
  MaintenanceStatus.IN_PROGRESS,
];

/** Domain representation of a maintenance. Pure TypeScript, no persistence concerns. */
export class Maintenance {
  constructor(
    public readonly id: string,
    public readonly type: MaintenanceType,
    public readonly description: string,
    public readonly mileage: number,
    public readonly scheduledStartDate: Date,
    public readonly scheduledEndDate: Date,
    public readonly status: MaintenanceStatus,
    public readonly workPerformed: string | null,
    public readonly finalCost: number | null,
    public readonly finalMileage: number | null,
    public readonly finishedAt: Date | null,
    public readonly vehicleId: string,
    public readonly mechanicId: string,
    public readonly workshopId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromRecord(record: MaintenanceRecord): Maintenance {
    return new Maintenance(
      record.id,
      record.type,
      record.description,
      record.mileage,
      record.scheduledStartDate,
      record.scheduledEndDate,
      record.status,
      record.workPerformed,
      record.finalCost,
      record.finalMileage,
      record.finishedAt,
      record.vehicleId,
      record.mechanicId,
      record.workshopId,
      record.createdAt,
      record.updatedAt,
    );
  }

  isAssignedTo(mechanicId: string): boolean {
    return this.mechanicId === mechanicId;
  }

  scheduleRange(): ScheduleRange {
    return ScheduleRange.create(this.scheduledStartDate, this.scheduledEndDate);
  }
}
