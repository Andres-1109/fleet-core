import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { GoogleProfile } from '../../application/dtos/google-profile.dto';

/**
 * Passport strategy for Google OAuth 2.0. It only extracts the identity from
 * Google; creating or finding the local user is the use case's job.
 *
 * It is registered by AuthModule only when Google credentials are configured.
 */
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  // The access/refresh tokens are not needed: only the identity is used.
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleProfile {
    const email = profile.emails?.[0];
    if (!email) {
      throw new UnauthorizedException(
        'The Google account did not share an email',
      );
    }
    return {
      email: email.value,
      name: profile.displayName,
      emailVerified: email.verified,
    };
  }
}
