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

@Injectable()
export class FindMaintenancesByVehicleUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: IMaintenanceRepository,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(vehicleId: string): Promise<Maintenance[]> {
    if (!(await this.vehicleRepository.findById(vehicleId))) {
      throw new RelatedResourceNotFoundException('Vehicle', vehicleId);
    }
    const records = await this.maintenanceRepository.findByVehicle(vehicleId);
    return records.map((record) => Maintenance.fromRecord(record));
  }
}
