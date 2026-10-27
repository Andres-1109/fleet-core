import { Inject, Injectable } from '@nestjs/common';
import {
  Role,
  UpdateUserData,
  USER_REPOSITORY,
} from '../../../../domain-contracts';
import type { IUserRepository } from '../../../../domain-contracts';
import { MechanicEmailInUseException } from '../../domain/mechanic-email-in-use.exception';
import { MechanicNotFoundException } from '../../domain/mechanic-not-found.exception';
import {
  MechanicProfile,
  toMechanicProfile,
} from '../dtos/mechanic-profile.dto';
import { UpdateMechanicDto } from '../dtos/update-mechanic.dto';

@Injectable()
export class UpdateMechanicUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string, dto: UpdateMechanicDto): Promise<MechanicProfile> {
    const mechanic = await this.userRepository.findById(id);
    if (mechanic?.role !== Role.MECHANIC) {
      throw new MechanicNotFoundException(id);
    }

    if (dto.email && dto.email !== mechanic.email) {
      await this.assertEmailAvailable(dto.email);
    }

    const changes: UpdateUserData = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.specialty !== undefined && { specialty: dto.specialty }),
    };
    // An empty body is a valid no-op; skip the write.
    if (Object.keys(changes).length === 0) {
      return toMechanicProfile(mechanic);
    }
    return toMechanicProfile(await this.userRepository.update(id, changes));
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    if (await this.userRepository.findByEmail(email)) {
      throw new MechanicEmailInUseException(email);
    }
  }
}
