import { Inject, Injectable } from '@nestjs/common';
import { Role, USER_REPOSITORY } from '../../../../domain-contracts';
import type { IUserRepository } from '../../../../domain-contracts';
import { MechanicNotFoundException } from '../../domain/mechanic-not-found.exception';
import {
  MechanicProfile,
  toMechanicProfile,
} from '../dtos/mechanic-profile.dto';

@Injectable()
export class FindOneMechanicUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<MechanicProfile> {
    const user = await this.userRepository.findById(id);
    // Users with another role are not mechanics: hide them behind a 404.
    if (user?.role !== Role.MECHANIC) {
      throw new MechanicNotFoundException(id);
    }
    return toMechanicProfile(user);
  }
}
