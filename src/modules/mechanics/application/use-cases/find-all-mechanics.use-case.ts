import { Inject, Injectable } from '@nestjs/common';
import { Role, USER_REPOSITORY } from '../../../../domain-contracts';
import type { IUserRepository } from '../../../../domain-contracts';
import {
  MechanicProfile,
  toMechanicProfile,
} from '../dtos/mechanic-profile.dto';

@Injectable()
export class FindAllMechanicsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(): Promise<MechanicProfile[]> {
    const mechanics = await this.userRepository.findAllByRole(Role.MECHANIC);
    return mechanics.map(toMechanicProfile);
  }
}
