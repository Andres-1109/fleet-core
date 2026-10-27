import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  CreateMaintenanceData,
  IMaintenanceRepository,
  MaintenanceFilter,
  MaintenanceRecord,
  MaintenanceStatus,
  StatusUpdateCommand,
  VehicleStatusSync,
} from '../../../../domain-contracts';
import {
  isExclusionViolation,
  isUniqueViolation,
} from '../../../../shared/persistence/postgres-errors';
import { ACTIVE_MAINTENANCE_STATUSES } from '../../domain/maintenance.entity';
import { ScheduleOverlapException } from '../../domain/schedule-overlap.exception';
import { VehicleHasActiveMaintenanceException } from '../../domain/vehicle-has-active-maintenance.exception';
import { MaintenanceOrmEntity } from './maintenance.orm-entity';

@Injectable()
export class MaintenanceTypeormRepository implements IMaintenanceRepository {
  constructor(
    @InjectRepository(MaintenanceOrmEntity)
    private readonly repository: Repository<MaintenanceOrmEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  findById(id: string): Promise<MaintenanceRecord | null> {
    return this.repository.findOneBy({ id });
  }

  findAll(filter: MaintenanceFilter = {}): Promise<MaintenanceRecord[]> {
    // Only provided filters become conditions; undefined keys are dropped.
    const where = Object.fromEntries(
      Object.entries(filter).filter(([, value]) => value !== undefined),
    ) as MaintenanceFilter;
    return this.repository.find({
      where,
      order: { scheduledStartDate: 'DESC' },
    });
  }

  findActive(): Promise<MaintenanceRecord[]> {
    return this.repository.find({
      where: { status: In(ACTIVE_MAINTENANCE_STATUSES) },
      order: { scheduledStartDate: 'ASC' },
    });
  }

  findByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    return this.repository.find({
      where: { vehicleId },
      order: { scheduledStartDate: 'DESC' },
    });
  }

  findByMechanic(mechanicId: string): Promise<MaintenanceRecord[]> {
    return this.repository.find({
      where: { mechanicId },
      order: { scheduledStartDate: 'DESC' },
    });
  }

  findActiveByVehicle(vehicleId: string): Promise<MaintenanceRecord | null> {
    return this.repository.findOneBy({
      vehicleId,
      status: In(ACTIVE_MAINTENANCE_STATUSES),
    });
  }

  findActiveByMechanic(mechanicId: string): Promise<MaintenanceRecord[]> {
    return this.repository.findBy({
      mechanicId,
      status: In(ACTIVE_MAINTENANCE_STATUSES),
    });
  }

  async create(data: CreateMaintenanceData): Promise<MaintenanceRecord> {
    try {
      return await this.repository.save(
        this.repository.create({
          ...data,
          status: MaintenanceStatus.SCHEDULED,
        }),
      );
    } catch (error) {
      // Concurrent requests can both pass the use-case checks; the database
      // constraints decide and must surface as 409s, not 500s.
      if (isUniqueViolation(error)) {
        throw new VehicleHasActiveMaintenanceException(data.vehicleId);
      }
      if (isExclusionViolation(error)) {
        throw new ScheduleOverlapException(data.mechanicId);
      }
      throw error;
    }
  }

  updateStatus(
    command: StatusUpdateCommand,
  ): Promise<MaintenanceRecord | null> {
    return this.dataSource.transaction(async (manager) => {
      // Conditional update: only applies if no one changed the status first.
      const result = await manager.update(
        MaintenanceOrmEntity,
        { id: command.id, status: command.expectedStatus },
        command.change,
      );
      if (result.affected !== 1) {
        return null;
      }
      if (command.vehicleSync) {
        await this.syncVehicle(manager, command.vehicleSync);
      }
      return manager.findOneByOrFail(MaintenanceOrmEntity, { id: command.id });
    });
  }

  /** Updates the vehicle through its entity name to avoid a cross-module import. */
  private async syncVehicle(
    manager: EntityManager,
    sync: VehicleStatusSync,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update('VehicleOrmEntity')
      .set({
        status: sync.status,
        ...(sync.mileage !== undefined && { mileage: sync.mileage }),
      })
      .where('id = :id', { id: sync.vehicleId })
      .execute();
  }
}
