import { Inject, Injectable } from '@nestjs/common';
import { MAINTENANCE_REPOSITORY } from '../../../../domain-contracts';
import type { IMaintenanceRepository } from '../../../../domain-contracts';
import { Maintenance } from '../../domain/maintenance.entity';
import { ListMaintenancesQueryDto } from '../dtos/list-maintenances-query.dto';

@Injectable()
export class FindAllMaintenancesUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: IMaintenanceRepository,
  ) {}

  async execute(query: ListMaintenancesQueryDto): Promise<Maintenance[]> {
    const records = await this.maintenanceRepository.findAll({
      status: query.status,
      type: query.type,
      vehicleId: query.vehicleId,
      mechanicId: query.mechanicId,
      workshopId: query.workshopId,
    });
    return records.map((record) => Maintenance.fromRecord(record));
  }
}
