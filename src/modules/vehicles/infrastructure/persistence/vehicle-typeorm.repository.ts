import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateVehicleData,
  IVehicleRepository,
  UpdateVehicleData,
  VehicleRecord,
} from '../../../../domain-contracts';
import { isUniqueViolation } from '../../../../shared/persistence/postgres-errors';
import { DuplicatePlateException } from '../../domain/duplicate-plate.exception';
import { VehicleOrmEntity } from './vehicle.orm-entity';

@Injectable()
export class VehicleTypeormRepository implements IVehicleRepository {
  constructor(
    @InjectRepository(VehicleOrmEntity)
    private readonly repository: Repository<VehicleOrmEntity>,
  ) {}

  findById(id: string): Promise<VehicleRecord | null> {
    return this.repository.findOneBy({ id });
  }

  findByPlate(plate: string): Promise<VehicleRecord | null> {
    return this.repository.findOneBy({ plate });
  }

  findAll(): Promise<VehicleRecord[]> {
    return this.repository.find({ order: { plate: 'ASC' } });
  }

  async create(data: CreateVehicleData): Promise<VehicleRecord> {
    try {
      return await this.repository.save(this.repository.create(data));
    } catch (error) {
      // The unique index is the final guard against concurrent duplicates.
      if (isUniqueViolation(error)) {
        throw new DuplicatePlateException(data.plate);
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateVehicleData): Promise<VehicleRecord> {
    try {
      await this.repository.update({ id }, data);
    } catch (error) {
      if (data.plate !== undefined && isUniqueViolation(error)) {
        throw new DuplicatePlateException(data.plate);
      }
      throw error;
    }
    return this.repository.findOneByOrFail({ id });
  }
}
