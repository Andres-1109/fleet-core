import { Inject, Injectable } from '@nestjs/common';
import {
  VEHICLE_REPOSITORY,
  VehicleStatus,
} from '../../../../domain-contracts';
import type { IVehicleRepository } from '../../../../domain-contracts';
import { DuplicatePlateException } from '../../domain/duplicate-plate.exception';
import { Vehicle } from '../../domain/vehicle.entity';
import { CreateVehicleDto } from '../dtos/create-vehicle.dto';

@Injectable()
export class CreateVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(dto: CreateVehicleDto): Promise<Vehicle> {
    if (await this.vehicleRepository.findByPlate(dto.plate)) {
      throw new DuplicatePlateException(dto.plate);
    }

    const record = await this.vehicleRepository.create({
      plate: dto.plate,
      brand: dto.brand,
      model: dto.model,
      year: dto.year,
      mileage: dto.mileage,
      status: VehicleStatus.AVAILABLE,
    });
    return Vehicle.fromRecord(record);
  }
}
