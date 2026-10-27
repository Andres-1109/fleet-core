import { Inject, Injectable } from '@nestjs/common';
import { Role, WORKSHOP_REPOSITORY } from '../../../../domain-contracts';
import type { IWorkshopRepository } from '../../../../domain-contracts';
import { Workshop } from '../../domain/workshop.entity';
import { ListWorkshopsQueryDto } from '../dtos/list-workshops-query.dto';

@Injectable()
export class FindAllWorkshopsUseCase {
  constructor(
    @Inject(WORKSHOP_REPOSITORY)
    private readonly workshopRepository: IWorkshopRepository,
  ) {}

  /**
   * Lists active workshops. Admins may also request inactive ones so they can
   * find a workshop to reactivate.
   */
  async execute(
    query: ListWorkshopsQueryDto,
    requesterRole: Role,
  ): Promise<Workshop[]> {
    const canSeeInactive =
      requesterRole === Role.ADMIN && query.includeInactive === true;

    const records = await this.workshopRepository.findAll(
      canSeeInactive ? undefined : { isActive: true },
    );
    return records.map((record) => Workshop.fromRecord(record));
  }
}
