import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { isGoogleOAuthConfigured } from '../../config/google-oauth.config';
import { PASSWORD_HASHER, USER_REPOSITORY } from '../../domain-contracts';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { LoginWithGoogleUseCase } from './application/use-cases/login-with-google.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { UserTypeormRepository } from './infrastructure/persistence/user-typeorm.repository';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { BcryptPasswordHasher } from './infrastructure/services/bcrypt-password-hasher.service';
import { GoogleOAuthStateService } from './infrastructure/services/google-oauth-state.service';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { GoogleStrategy } from './infrastructure/strategies/google.strategy';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { AuthController } from './interfaces/controllers/auth.controller';
import { GoogleAuthGuard } from './interfaces/guards/google-auth.guard';

const GOOGLE_STRATEGY = Symbol('GOOGLE_STRATEGY');

/**
 * Passport strategies register themselves on construction, so the Google one
 * is created only when credentials exist; otherwise the app boots without it
 * and the Google endpoints answer 503.
 */
function buildGoogleStrategy(
  configService: ConfigService,
): GoogleStrategy | null {
  if (!isGoogleOAuthConfigured(configService)) {
    new Logger('AuthModule').warn(
      'Google OAuth credentials are not configured; Google login is disabled',
    );
    return null;
  }
  return new GoogleStrategy(configService);
}

function buildJwtOptions(configService: ConfigService): JwtModuleOptions {
  return {
    secret: configService.getOrThrow<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: configService.getOrThrow<string>(
        'JWT_EXPIRES_IN',
      ) as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'],
    },
  };
}

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: buildJwtOptions,
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    LoginWithGoogleUseCase,
    JwtStrategy,
    GoogleOAuthStateService,
    GoogleAuthGuard,
    {
      provide: GOOGLE_STRATEGY,
      inject: [ConfigService],
      useFactory: buildGoogleStrategy,
    },
    { provide: USER_REPOSITORY, useClass: UserTypeormRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  // Other modules reuse the user repository and the password hasher.
  exports: [USER_REPOSITORY, PASSWORD_HASHER],
})
export class AuthModule {}
