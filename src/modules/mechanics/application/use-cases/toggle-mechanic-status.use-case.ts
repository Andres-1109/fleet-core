import { Inject, Injectable } from '@nestjs/common';
import { Role, USER_REPOSITORY } from '../../../../domain-contracts';
import type { IUserRepository } from '../../../../domain-contracts';
import { MechanicNotFoundException } from '../../domain/mechanic-not-found.exception';
import {
  MechanicProfile,
  toMechanicProfile,
} from '../dtos/mechanic-profile.dto';

/**
 * Flips a mechanic between active and inactive. Inactive mechanics cannot log
 * in and cannot be assigned to new maintenances (enforced in Stage 7).
 */
@Injectable()
export class ToggleMechanicStatusUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<MechanicProfile> {
    const mechanic = await this.userRepository.findById(id);
    if (mechanic?.role !== Role.MECHANIC) {
      throw new MechanicNotFoundException(id);
    }
    const updated = await this.userRepository.update(id, {
      isActive: !mechanic.isActive,
    });
    return toMechanicProfile(updated);
  }
}
