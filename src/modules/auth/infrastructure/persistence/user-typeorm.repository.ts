import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateUserData,
  IUserRepository,
  Role,
  UpdateUserData,
  UserRecord,
} from '../../../../domain-contracts';
import { isUniqueViolation } from '../../../../shared/persistence/postgres-errors';
import { UserAlreadyExistsException } from '../../domain/user-already-exists.exception';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class UserTypeormRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  findById(id: string): Promise<UserRecord | null> {
    return this.repository.findOneBy({ id });
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.repository.findOneBy({ email });
  }

  findAllByRole(role: Role): Promise<UserRecord[]> {
    return this.repository.find({ where: { role }, order: { name: 'ASC' } });
  }

  async create(data: CreateUserData): Promise<UserRecord> {
    try {
      return await this.repository.save(this.repository.create(data));
    } catch (error) {
      // Two concurrent registrations can both pass the pre-check; the unique
      // index is the final guard and must surface as a 409, not a 500.
      if (isUniqueViolation(error)) {
        throw new UserAlreadyExistsException(data.email);
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    try {
      await this.repository.update({ id }, data);
    } catch (error) {
      // Same race as in create(): the unique index decides, surfacing as 409.
      if (data.email !== undefined && isUniqueViolation(error)) {
        throw new UserAlreadyExistsException(data.email);
      }
      throw error;
    }
    return this.repository.findOneByOrFail({ id });
  }
}
