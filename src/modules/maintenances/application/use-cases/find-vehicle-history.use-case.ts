import { Inject, Injectable } from '@nestjs/common';
import {
  MAINTENANCE_REPOSITORY,
  VEHICLE_REPOSITORY,
} from '../../../../domain-contracts';
import type {
  IMaintenanceRepository,
  IVehicleRepository,
} from '../../../../domain-contracts';
import { Maintenance } from '../../domain/maintenance.entity';
import { RelatedResourceNotFoundException } from '../../domain/related-resource-not-found.exception';
import { VehicleHistory } from '../dtos/vehicle-history.dto';

@Injectable()
export class FindVehicleHistoryUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: IMaintenanceRepository,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(plate: string): Promise<VehicleHistory> {
    // Plates are stored trimmed and upper-cased by the vehicles module.
    const normalizedPlate = plate.trim().toUpperCase();
    const vehicle = await this.vehicleRepository.findByPlate(normalizedPlate);
    if (!vehicle) {
      throw new RelatedResourceNotFoundException('Vehicle', normalizedPlate);
    }

    const records = await this.maintenanceRepository.findByVehicle(vehicle.id);
    return {
      vehicle,
      maintenances: records.map((record) => Maintenance.fromRecord(record)),
    };
  }
}
