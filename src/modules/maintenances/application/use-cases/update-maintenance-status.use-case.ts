import { Inject, Injectable } from '@nestjs/common';
import {
  MAINTENANCE_REPOSITORY,
  MaintenanceStatus,
  Role,
  VEHICLE_REPOSITORY,
  VehicleStatus,
} from '../../../../domain-contracts';
import type {
  AuthenticatedUser,
  IMaintenanceRepository,
  IVehicleRepository,
  MaintenanceStatusChange,
  VehicleRecord,
  VehicleStatusSync,
} from '../../../../domain-contracts';
import { InactiveResourceException } from '../../domain/inactive-resource.exception';
import { InvalidClosingDetailsException } from '../../domain/invalid-closing-details.exception';
import { InvalidMileageException } from '../../domain/invalid-mileage.exception';
import { MaintenanceAccessDeniedException } from '../../domain/maintenance-access-denied.exception';
import { MaintenanceModifiedConcurrentlyException } from '../../domain/maintenance-modified-concurrently.exception';
import { MaintenanceNotFoundException } from '../../domain/maintenance-not-found.exception';
import { MaintenanceStateMachine } from '../../domain/maintenance-state-machine';
import { Maintenance } from '../../domain/maintenance.entity';
import { RelatedResourceNotFoundException } from '../../domain/related-resource-not-found.exception';
import { UpdateMaintenanceStatusDto } from '../dtos/update-maintenance-status.dto';

const CLOSING_FIELDS = [
  'workPerformed',
  'finalCost',
  'finalMileage',
  'finishedAt',
] as const;

@Injectable()
export class UpdateMaintenanceStatusUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: IMaintenanceRepository,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateMaintenanceStatusDto,
    requester: AuthenticatedUser,
  ): Promise<Maintenance> {
    const maintenance = await this.loadAccessibleMaintenance(id, requester);
    MaintenanceStateMachine.assertTransition(maintenance.status, dto.status);

    const change = this.buildStatusChange(maintenance, dto);
    const vehicleSync = await this.resolveVehicleSync(maintenance, dto);

    // Status change and vehicle sync are committed in a single transaction.
    const updated = await this.maintenanceRepository.updateStatus({
      id,
      expectedStatus: maintenance.status,
      change,
      vehicleSync,
    });
    if (!updated) {
      throw new MaintenanceModifiedConcurrentlyException(id);
    }
    return Maintenance.fromRecord(updated);
  }

  /** Mechanics may only change maintenances assigned to them. */
  private async loadAccessibleMaintenance(
    id: string,
    requester: AuthenticatedUser,
  ): Promise<Maintenance> {
    const record = await this.maintenanceRepository.findById(id);
    if (!record) {
      throw new MaintenanceNotFoundException(id);
    }
    const maintenance = Maintenance.fromRecord(record);
    if (
      requester.role === Role.MECHANIC &&
      !maintenance.isAssignedTo(requester.id)
    ) {
      throw new MaintenanceAccessDeniedException();
    }
    return maintenance;
  }

  /**
   * Closing fields are mandatory when the transition requires them (COMPLETED)
   * and rejected otherwise, so data never lands on the wrong status.
   */
  private buildStatusChange(
    maintenance: Maintenance,
    dto: UpdateMaintenanceStatusDto,
  ): MaintenanceStatusChange {
    const provided = CLOSING_FIELDS.filter((field) => dto[field] !== undefined);

    if (!MaintenanceStateMachine.requiresClosingDetails(dto.status)) {
      if (provided.length > 0) {
        throw InvalidClosingDetailsException.notAllowed();
      }
      return { status: dto.status };
    }

    const missing = CLOSING_FIELDS.filter((field) => dto[field] === undefined);
    if (missing.length > 0) {
      throw InvalidClosingDetailsException.missing(missing);
    }
    return this.closingChange(maintenance, dto);
  }

  private closingChange(
    maintenance: Maintenance,
    dto: UpdateMaintenanceStatusDto,
  ): MaintenanceStatusChange {
    const finalMileage = dto.finalMileage ?? 0;
    if (finalMileage < maintenance.mileage) {
      throw new InvalidMileageException(
        'finalMileage',
        finalMileage,
        maintenance.mileage,
      );
    }
    return {
      status: dto.status,
      workPerformed: dto.workPerformed,
      finalCost: dto.finalCost,
      finalMileage,
      finishedAt: dto.finishedAt,
    };
  }

  /**
   * Derives the vehicle side effect from the state machine. On completion the
   * vehicle odometer also advances to the final mileage.
   */
  private async resolveVehicleSync(
    maintenance: Maintenance,
    dto: UpdateMaintenanceStatusDto,
  ): Promise<VehicleStatusSync | null> {
    const vehicle = await this.loadVehicle(maintenance.vehicleId);
    // A vehicle deactivated after scheduling cannot be taken into the shop.
    if (
      dto.status === MaintenanceStatus.IN_PROGRESS &&
      vehicle.status === VehicleStatus.INACTIVE
    ) {
      throw new InactiveResourceException('Vehicle', vehicle.plate);
    }

    const nextStatus = MaintenanceStateMachine.nextVehicleStatus(
      dto.status,
      vehicle.status,
    );
    if (nextStatus === null) {
      return null;
    }
    return {
      vehicleId: vehicle.id,
      status: nextStatus,
      mileage: this.advancedMileage(vehicle, dto),
    };
  }

  private async loadVehicle(vehicleId: string): Promise<VehicleRecord> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new RelatedResourceNotFoundException('Vehicle', vehicleId);
    }
    return vehicle;
  }

  /** The odometer only moves forward, and only when the work is completed. */
  private advancedMileage(
    vehicle: VehicleRecord,
    dto: UpdateMaintenanceStatusDto,
  ): number | undefined {
    return dto.status === MaintenanceStatus.COMPLETED
      ? Math.max(vehicle.mileage, dto.finalMileage ?? vehicle.mileage)
      : undefined;
  }
}
