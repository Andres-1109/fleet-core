import { Inject, Injectable } from '@nestjs/common';
import {
  MAINTENANCE_REPOSITORY,
  Role,
  USER_REPOSITORY,
  VEHICLE_REPOSITORY,
  VehicleStatus,
  WORKSHOP_REPOSITORY,
} from '../../../../domain-contracts';
import type {
  IMaintenanceRepository,
  IUserRepository,
  IVehicleRepository,
  IWorkshopRepository,
  UserRecord,
  VehicleRecord,
} from '../../../../domain-contracts';
import { InactiveResourceException } from '../../domain/inactive-resource.exception';
import { InvalidMileageException } from '../../domain/invalid-mileage.exception';
import { Maintenance } from '../../domain/maintenance.entity';
import { RelatedResourceNotFoundException } from '../../domain/related-resource-not-found.exception';
import { ScheduleOverlapException } from '../../domain/schedule-overlap.exception';
import { ScheduleRange } from '../../domain/schedule-range';
import { VehicleHasActiveMaintenanceException } from '../../domain/vehicle-has-active-maintenance.exception';
import { CreateMaintenanceDto } from '../dtos/create-maintenance.dto';

@Injectable()
export class CreateMaintenanceUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: IMaintenanceRepository,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(WORKSHOP_REPOSITORY)
    private readonly workshopRepository: IWorkshopRepository,
  ) {}

  async execute(dto: CreateMaintenanceDto): Promise<Maintenance> {
    const range = ScheduleRange.create(
      dto.scheduledStartDate,
      dto.scheduledEndDate,
    );
    const vehicle = await this.loadAssignableVehicle(dto);
    const mechanic = await this.loadAssignableMechanic(dto.mechanicId);
    await this.assertWorkshopAssignable(dto.workshopId);
    await this.assertNoActiveMaintenance(vehicle);
    await this.assertMechanicAvailable(mechanic, range);

    const record = await this.maintenanceRepository.create({
      type: dto.type,
      description: dto.description,
      mileage: dto.mileage,
      scheduledStartDate: dto.scheduledStartDate,
      scheduledEndDate: dto.scheduledEndDate,
      vehicleId: vehicle.id,
      mechanicId: mechanic.id,
      workshopId: dto.workshopId,
    });
    return Maintenance.fromRecord(record);
  }

  /** Vehicle must exist, be active, and the new mileage cannot go backwards. */
  private async loadAssignableVehicle(
    dto: CreateMaintenanceDto,
  ): Promise<VehicleRecord> {
    const vehicle = await this.vehicleRepository.findById(dto.vehicleId);
    if (!vehicle) {
      throw new RelatedResourceNotFoundException('Vehicle', dto.vehicleId);
    }
    if (vehicle.status === VehicleStatus.INACTIVE) {
      throw new InactiveResourceException('Vehicle', vehicle.plate);
    }
    if (dto.mileage < vehicle.mileage) {
      throw new InvalidMileageException(
        'mileage',
        dto.mileage,
        vehicle.mileage,
      );
    }
    return vehicle;
  }

  private async loadAssignableMechanic(
    mechanicId: string,
  ): Promise<UserRecord> {
    const user = await this.userRepository.findById(mechanicId);
    if (user?.role !== Role.MECHANIC) {
      throw new RelatedResourceNotFoundException('Mechanic', mechanicId);
    }
    if (!user.isActive) {
      throw new InactiveResourceException('Mechanic', user.name);
    }
    return user;
  }

  private async assertWorkshopAssignable(workshopId: string): Promise<void> {
    const workshop = await this.workshopRepository.findById(workshopId);
    if (!workshop) {
      throw new RelatedResourceNotFoundException('Workshop', workshopId);
    }
    if (!workshop.isActive) {
      throw new InactiveResourceException('Workshop', workshop.name);
    }
  }

  private async assertNoActiveMaintenance(
    vehicle: VehicleRecord,
  ): Promise<void> {
    const active = await this.maintenanceRepository.findActiveByVehicle(
      vehicle.id,
    );
    if (active) {
      throw new VehicleHasActiveMaintenanceException(vehicle.plate);
    }
  }

  /**
   * Schedule overlap check: the new [start, end) window must not intersect any
   * of the mechanic's SCHEDULED or IN_PROGRESS maintenances. Back-to-back
   * windows (one ends exactly when the other starts) are allowed.
   */
  private async assertMechanicAvailable(
    mechanic: UserRecord,
    range: ScheduleRange,
  ): Promise<void> {
    const activeMaintenances =
      await this.maintenanceRepository.findActiveByMechanic(mechanic.id);
    const conflict = activeMaintenances
      .map((record) => Maintenance.fromRecord(record))
      .find((maintenance) => maintenance.scheduleRange().overlaps(range));

    if (conflict) {
      throw new ScheduleOverlapException(
        mechanic.name,
        conflict.scheduledStartDate,
        conflict.scheduledEndDate,
      );
    }
  }
}
