import { Inject, Injectable } from '@nestjs/common';
import {
  UpdateVehicleData,
  VEHICLE_REPOSITORY,
  VehicleStatus,
} from '../../../../domain-contracts';
import type { IVehicleRepository } from '../../../../domain-contracts';
import { DuplicatePlateException } from '../../domain/duplicate-plate.exception';
import { InactiveVehicleException } from '../../domain/inactive-vehicle.exception';
import { VehicleInMaintenanceException } from '../../domain/vehicle-in-maintenance.exception';
import { VehicleNotFoundException } from '../../domain/vehicle-not-found.exception';
import { Vehicle } from '../../domain/vehicle.entity';
import { UpdateVehicleDto } from '../dtos/update-vehicle.dto';

@Injectable()
export class UpdateVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const record = await this.vehicleRepository.findById(id);
    if (!record) {
      throw new VehicleNotFoundException(id);
    }
    const vehicle = Vehicle.fromRecord(record);

    this.assertStatusRules(vehicle, dto);
    if (dto.plate && dto.plate !== vehicle.plate) {
      await this.assertPlateAvailable(dto.plate);
    }

    const changes: UpdateVehicleData = {
      ...(dto.plate !== undefined && { plate: dto.plate }),
      ...(dto.brand !== undefined && { brand: dto.brand }),
      ...(dto.model !== undefined && { model: dto.model }),
      ...(dto.year !== undefined && { year: dto.year }),
      ...(dto.mileage !== undefined && { mileage: dto.mileage }),
      ...(dto.status !== undefined && { status: dto.status }),
    };
    if (Object.keys(changes).length === 0) {
      return vehicle;
    }
    return Vehicle.fromRecord(await this.vehicleRepository.update(id, changes));
  }

  /**
   * - IN_MAINTENANCE vehicles: status is owned by the maintenance lifecycle.
   * - INACTIVE vehicles: the only allowed change is reactivation (AVAILABLE).
   */
  private assertStatusRules(vehicle: Vehicle, dto: UpdateVehicleDto): void {
    if (vehicle.isInMaintenance() && dto.status !== undefined) {
      throw new VehicleInMaintenanceException(vehicle.plate);
    }
    if (vehicle.isInactive() && dto.status !== VehicleStatus.AVAILABLE) {
      throw new InactiveVehicleException(vehicle.plate);
    }
  }

  private async assertPlateAvailable(plate: string): Promise<void> {
    if (await this.vehicleRepository.findByPlate(plate)) {
      throw new DuplicatePlateException(plate);
    }
  }
}
