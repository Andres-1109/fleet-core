import { VehicleRecord, VehicleStatus } from '../../../domain-contracts';

/** Domain representation of a vehicle. Pure TypeScript, no persistence concerns. */
export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly plate: string,
    public readonly brand: string,
    public readonly model: string,
    public readonly year: number,
    public readonly mileage: number,
    public readonly status: VehicleStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromRecord(record: VehicleRecord): Vehicle {
    return new Vehicle(
      record.id,
      record.plate,
      record.brand,
      record.model,
      record.year,
      record.mileage,
      record.status,
      record.createdAt,
      record.updatedAt,
    );
  }

  /** Plates are stored and compared trimmed and upper-cased. */
  static normalizePlate(plate: string): string {
    return plate.trim().toUpperCase();
  }

  isInactive(): boolean {
    return this.status === VehicleStatus.INACTIVE;
  }

  isInMaintenance(): boolean {
    return this.status === VehicleStatus.IN_MAINTENANCE;
  }
}
