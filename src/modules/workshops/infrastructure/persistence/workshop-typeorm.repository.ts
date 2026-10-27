import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateWorkshopData,
  IWorkshopRepository,
  UpdateWorkshopData,
  WorkshopRecord,
} from '../../../../domain-contracts';
import { WorkshopOrmEntity } from './workshop.orm-entity';

@Injectable()
export class WorkshopTypeormRepository implements IWorkshopRepository {
  constructor(
    @InjectRepository(WorkshopOrmEntity)
    private readonly repository: Repository<WorkshopOrmEntity>,
  ) {}

  findById(id: string): Promise<WorkshopRecord | null> {
    return this.repository.findOneBy({ id });
  }

  findAll(filter?: { isActive?: boolean }): Promise<WorkshopRecord[]> {
    return this.repository.find({
      where:
        filter?.isActive === undefined ? {} : { isActive: filter.isActive },
      order: { name: 'ASC' },
    });
  }

  create(data: CreateWorkshopData): Promise<WorkshopRecord> {
    return this.repository.save(this.repository.create(data));
  }

  async update(id: string, data: UpdateWorkshopData): Promise<WorkshopRecord> {
    await this.repository.update({ id }, data);
    return this.repository.findOneByOrFail({ id });
  }
}
