import { Inject, Injectable } from '@nestjs/common';
import { WORKSHOP_REPOSITORY } from '../../../../domain-contracts';
import type { IWorkshopRepository } from '../../../../domain-contracts';
import { WorkshopNotFoundException } from '../../domain/workshop-not-found.exception';
import { Workshop } from '../../domain/workshop.entity';

/**
 * Flips a workshop between active and inactive. Inactive workshops cannot be
 * assigned to new maintenances (enforced in Stage 7).
 */
@Injectable()
export class ToggleWorkshopStatusUseCase {
  constructor(
    @Inject(WORKSHOP_REPOSITORY)
    private readonly workshopRepository: IWorkshopRepository,
  ) {}

  async execute(id: string): Promise<Workshop> {
    const record = await this.workshopRepository.findById(id);
    if (!record) {
      throw new WorkshopNotFoundException(id);
    }
    const updated = await this.workshopRepository.update(id, {
      isActive: !record.isActive,
    });
    return Workshop.fromRecord(updated);
  }
}
