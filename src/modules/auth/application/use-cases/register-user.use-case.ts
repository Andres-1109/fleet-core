import { Inject, Injectable } from '@nestjs/common';
import { PASSWORD_HASHER } from '../../../../domain-contracts';
import type { IPasswordHasher } from '../../../../domain-contracts';
import { Role, USER_REPOSITORY } from '../../../../domain-contracts';
import { User } from '../../domain/user.entity';
import { UserAlreadyExistsException } from '../../domain/user-already-exists.exception';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { toUserProfile, UserProfile } from '../dtos/user-profile.dto';
import type { IUserRepository } from '../ports/user-repository.port';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserProfile> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new UserAlreadyExistsException(dto.email);
    }

    const record = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: await this.passwordHasher.hash(dto.password),
      role: dto.role,
      // Only mechanics have a specialty; ignore it for any other role.
      specialty: dto.role === Role.MECHANIC ? (dto.specialty ?? null) : null,
      isActive: true,
    });

    return toUserProfile(User.fromRecord(record));
  }
}
