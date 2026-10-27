import { Inject, Injectable } from '@nestjs/common';
import { MAINTENANCE_REPOSITORY } from '../../../../domain-contracts';
import type { IMaintenanceRepository } from '../../../../domain-contracts';
import { Maintenance } from '../../domain/maintenance.entity';

/** SCHEDULED and IN_PROGRESS maintenances, soonest first. */
@Injectable()
export class FindActiveMaintenancesUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: IMaintenanceRepository,
  ) {}

  async execute(): Promise<Maintenance[]> {
    const records = await this.maintenanceRepository.findActive();
    return records.map((record) => Maintenance.fromRecord(record));
  }
}
