import { Inject, Injectable } from '@nestjs/common';
import {
  UpdateWorkshopData,
  WORKSHOP_REPOSITORY,
} from '../../../../domain-contracts';
import type { IWorkshopRepository } from '../../../../domain-contracts';
import { WorkshopNotFoundException } from '../../domain/workshop-not-found.exception';
import { Workshop } from '../../domain/workshop.entity';
import { UpdateWorkshopDto } from '../dtos/update-workshop.dto';

@Injectable()
export class UpdateWorkshopUseCase {
  constructor(
    @Inject(WORKSHOP_REPOSITORY)
    private readonly workshopRepository: IWorkshopRepository,
  ) {}

  async execute(id: string, dto: UpdateWorkshopDto): Promise<Workshop> {
    const record = await this.workshopRepository.findById(id);
    if (!record) {
      throw new WorkshopNotFoundException(id);
    }

    const changes: UpdateWorkshopData = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.address !== undefined && { address: dto.address }),
    };
    // An empty body is a valid no-op; skip the write.
    if (Object.keys(changes).length === 0) {
      return Workshop.fromRecord(record);
    }
    return Workshop.fromRecord(
      await this.workshopRepository.update(id, changes),
    );
  }
}
