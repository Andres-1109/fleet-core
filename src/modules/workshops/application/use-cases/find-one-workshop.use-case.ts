import { Inject, Injectable } from '@nestjs/common';
import { WORKSHOP_REPOSITORY } from '../../../../domain-contracts';
import type { IWorkshopRepository } from '../../../../domain-contracts';
import { WorkshopNotFoundException } from '../../domain/workshop-not-found.exception';
import { Workshop } from '../../domain/workshop.entity';

@Injectable()
export class FindOneWorkshopUseCase {
  constructor(
    @Inject(WORKSHOP_REPOSITORY)
    private readonly workshopRepository: IWorkshopRepository,
  ) {}

  async execute(id: string): Promise<Workshop> {
    const record = await this.workshopRepository.findById(id);
    if (!record) {
      throw new WorkshopNotFoundException(id);
    }
    return Workshop.fromRecord(record);
  }
}
