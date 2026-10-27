import { Inject, Injectable } from '@nestjs/common';
import {
  MAINTENANCE_REPOSITORY,
  Role,
  USER_REPOSITORY,
} from '../../../../domain-contracts';
import type {
  AuthenticatedUser,
  IMaintenanceRepository,
  IUserRepository,
} from '../../../../domain-contracts';
import { MaintenanceAccessDeniedException } from '../../domain/maintenance-access-denied.exception';
import { Maintenance } from '../../domain/maintenance.entity';
import { RelatedResourceNotFoundException } from '../../domain/related-resource-not-found.exception';

@Injectable()
export class FindMaintenancesByMechanicUseCase {
  constructor(
    @Inject(MAINTENANCE_REPOSITORY)
    private readonly maintenanceRepository: IMaintenanceRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  /** Admins can query any mechanic; mechanics only themselves. */
  async execute(
    mechanicId: string,
    requester: AuthenticatedUser,
  ): Promise<Maintenance[]> {
    if (requester.role === Role.MECHANIC && requester.id !== mechanicId) {
      throw new MaintenanceAccessDeniedException();
    }
    const mechanic = await this.userRepository.findById(mechanicId);
    if (mechanic?.role !== Role.MECHANIC) {
      throw new RelatedResourceNotFoundException('Mechanic', mechanicId);
    }

    const records = await this.maintenanceRepository.findByMechanic(mechanicId);
    return records.map((record) => Maintenance.fromRecord(record));
  }
}
