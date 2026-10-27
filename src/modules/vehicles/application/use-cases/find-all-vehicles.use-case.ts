import { Inject, Injectable } from '@nestjs/common';
import { VEHICLE_REPOSITORY } from '../../../../domain-contracts';
import type { IVehicleRepository } from '../../../../domain-contracts';
import { Vehicle } from '../../domain/vehicle.entity';

@Injectable()
export class FindAllVehiclesUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(): Promise<Vehicle[]> {
    const records = await this.vehicleRepository.findAll();
    return records.map((record) => Vehicle.fromRecord(record));
  }
}
