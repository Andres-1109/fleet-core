import { Inject, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { VEHICLE_REPOSITORY } from '../../../../domain-contracts';
import type { IVehicleRepository } from '../../../../domain-contracts';
import { VehicleNotFoundException } from '../../domain/vehicle-not-found.exception';
import { Vehicle } from '../../domain/vehicle.entity';

@Injectable()
export class FindVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  /** Resolves the identifier as a UUID first, otherwise as a license plate. */
  async execute(identifier: string): Promise<Vehicle> {
    const record = isUUID(identifier)
      ? await this.vehicleRepository.findById(identifier)
      : await this.vehicleRepository.findByPlate(
          Vehicle.normalizePlate(identifier),
        );

    if (!record) {
      throw new VehicleNotFoundException(identifier);
    }
    return Vehicle.fromRecord(record);
  }
}
