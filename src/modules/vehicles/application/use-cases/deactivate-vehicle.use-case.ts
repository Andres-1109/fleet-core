import { Inject, Injectable } from '@nestjs/common';
import {
  VEHICLE_REPOSITORY,
  VehicleStatus,
} from '../../../../domain-contracts';
import type { IVehicleRepository } from '../../../../domain-contracts';
import { VehicleInMaintenanceException } from '../../domain/vehicle-in-maintenance.exception';
import { VehicleNotFoundException } from '../../domain/vehicle-not-found.exception';
import { Vehicle } from '../../domain/vehicle.entity';

/** Logical deletion: the row is kept (maintenance history) and marked INACTIVE. */
@Injectable()
export class DeactivateVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(id: string): Promise<Vehicle> {
    const record = await this.vehicleRepository.findById(id);
    if (!record) {
      throw new VehicleNotFoundException(id);
    }

    const vehicle = Vehicle.fromRecord(record);
    if (vehicle.isInMaintenance()) {
      throw new VehicleInMaintenanceException(vehicle.plate);
    }
    // Deactivating twice is a harmless no-op.
    if (vehicle.isInactive()) {
      return vehicle;
    }

    const updated = await this.vehicleRepository.update(id, {
      status: VehicleStatus.INACTIVE,
    });
    return Vehicle.fromRecord(updated);
  }
}
