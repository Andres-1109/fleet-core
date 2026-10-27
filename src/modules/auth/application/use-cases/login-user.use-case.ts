import { Inject, Injectable } from '@nestjs/common';
import { PASSWORD_HASHER } from '../../../../domain-contracts';
import type { IPasswordHasher } from '../../../../domain-contracts';
import { USER_REPOSITORY } from '../../../../domain-contracts';
import { InvalidCredentialsException } from '../../domain/invalid-credentials.exception';
import { User } from '../../domain/user.entity';
import { LoginResult } from '../dtos/login-result.dto';
import { LoginUserDto } from '../dtos/login-user.dto';
import { toUserProfile } from '../dtos/user-profile.dto';
import { TOKEN_SERVICE } from '../ports/token-service.port';
import type { ITokenService } from '../ports/token-service.port';
import type { IUserRepository } from '../ports/user-repository.port';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: LoginUserDto): Promise<LoginResult> {
    const user = await this.findAuthenticatableUser(dto);

    const accessToken = await this.tokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, tokenType: 'Bearer', user: toUserProfile(user) };
  }

  /** Unknown email, wrong password and inactive account all fail identically. */
  private async findAuthenticatableUser(dto: LoginUserDto): Promise<User> {
    const record = await this.userRepository.findByEmail(dto.email);
    if (!record) {
      throw new InvalidCredentialsException();
    }

    const user = User.fromRecord(record);
    const passwordMatches = await this.passwordHasher.compare(
      dto.password,
      user.password,
    );
    if (!passwordMatches || !user.canAuthenticate()) {
      throw new InvalidCredentialsException();
    }
    return user;
  }
}
