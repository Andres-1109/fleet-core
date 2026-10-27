import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  PASSWORD_HASHER,
  Role,
  USER_REPOSITORY,
} from '../../../../domain-contracts';
import type {
  IPasswordHasher,
  IUserRepository,
} from '../../../../domain-contracts';
import { AccountInactiveException } from '../../domain/account-inactive.exception';
import { GoogleEmailNotVerifiedException } from '../../domain/google-email-not-verified.exception';
import { UserAlreadyExistsException } from '../../domain/user-already-exists.exception';
import { User } from '../../domain/user.entity';
import { GoogleProfile } from '../dtos/google-profile.dto';
import { LoginResult } from '../dtos/login-result.dto';
import { toUserProfile } from '../dtos/user-profile.dto';
import { TOKEN_SERVICE } from '../ports/token-service.port';
import type { ITokenService } from '../ports/token-service.port';

const MAX_NAME_LENGTH = 100;

/**
 * Signs a user in with a verified Google identity, creating a MECHANIC account
 * on first login. An existing account with the same email is reused, whatever
 * its role, because Google has vouched for ownership of that address.
 */
@Injectable()
export class LoginWithGoogleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(profile: GoogleProfile): Promise<LoginResult> {
    if (!profile.emailVerified) {
      throw new GoogleEmailNotVerifiedException();
    }

    const user = await this.findOrCreateUser(profile);
    if (!user.canAuthenticate()) {
      throw new AccountInactiveException();
    }

    const accessToken = await this.tokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken, tokenType: 'Bearer', user: toUserProfile(user) };
  }

  private async findOrCreateUser(profile: GoogleProfile): Promise<User> {
    const email = profile.email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      return User.fromRecord(existing);
    }

    try {
      return await this.createMechanic(profile, email);
    } catch (error) {
      // Two first-time logins racing: the loser reuses the winner's account.
      if (!(error instanceof UserAlreadyExistsException)) {
        throw error;
      }
      const winner = await this.userRepository.findByEmail(email);
      if (!winner) {
        throw error;
      }
      return User.fromRecord(winner);
    }
  }

  private async createMechanic(
    profile: GoogleProfile,
    email: string,
  ): Promise<User> {
    const record = await this.userRepository.create({
      name: profile.name.trim().slice(0, MAX_NAME_LENGTH) || email,
      email,
      // Google users have no password. Storing the hash of random bytes nobody
      // knows keeps the column populated while making password login impossible.
      password: await this.passwordHasher.hash(randomBytes(32).toString('hex')),
      role: Role.MECHANIC,
      specialty: null,
      isActive: true,
    });
    return User.fromRecord(record);
  }
}
