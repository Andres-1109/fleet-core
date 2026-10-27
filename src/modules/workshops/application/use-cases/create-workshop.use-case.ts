import { Inject, Injectable } from '@nestjs/common';
import { WORKSHOP_REPOSITORY } from '../../../../domain-contracts';
import type { IWorkshopRepository } from '../../../../domain-contracts';
import { Workshop } from '../../domain/workshop.entity';
import { CreateWorkshopDto } from '../dtos/create-workshop.dto';

@Injectable()
export class CreateWorkshopUseCase {
  constructor(
    @Inject(WORKSHOP_REPOSITORY)
    private readonly workshopRepository: IWorkshopRepository,
  ) {}

  async execute(dto: CreateWorkshopDto): Promise<Workshop> {
    const record = await this.workshopRepository.create({
      name: dto.name,
      address: dto.address,
      isActive: true,
    });
    return Workshop.fromRecord(record);
  }
}
