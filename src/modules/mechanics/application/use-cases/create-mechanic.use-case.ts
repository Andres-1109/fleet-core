import { Inject, Injectable } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  Role,
  USER_REPOSITORY,
} from '../../../../domain-contracts';
import type {
  IPasswordHasher,
  IUserRepository,
} from '../../../../domain-contracts';
import { MechanicEmailInUseException } from '../../domain/mechanic-email-in-use.exception';
import { CreateMechanicDto } from '../dtos/create-mechanic.dto';
import {
  MechanicProfile,
  toMechanicProfile,
} from '../dtos/mechanic-profile.dto';

@Injectable()
export class CreateMechanicUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(dto: CreateMechanicDto): Promise<MechanicProfile> {
    if (await this.userRepository.findByEmail(dto.email)) {
      throw new MechanicEmailInUseException(dto.email);
    }

    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: await this.passwordHasher.hash(dto.password),
      role: Role.MECHANIC,
      specialty: dto.specialty,
      isActive: true,
    });
    return toMechanicProfile(user);
  }
}
