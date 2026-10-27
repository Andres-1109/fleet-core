import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';

const STATE_PURPOSE = 'google-oauth-state';
const STATE_LIFETIME_SECONDS = 5 * 60;

/**
 * Stateless `state` handling for the OAuth redirect flow. The `state` sent to
 * Google is a short-lived signed token; the callback must bring it back intact.
 * This rejects unsolicited callbacks that did not start at this server, with no
 * session to store anything.
 *
 * Limitation: the token is not bound to the user's browser (that would need a
 * cookie), so it does not stop login-CSRF by itself. That matters only if a
 * browser frontend consumes the callback response.
 *
 * It is signed with a secret derived from JWT_SECRET, never the access-token
 * secret itself, so a state token can never be accepted as an access token.
 */
@Injectable()
export class GoogleOAuthStateService {
  private readonly secret: string;

  constructor(
    configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.secret = `${configService.getOrThrow<string>('JWT_SECRET')}:${STATE_PURPOSE}`;
  }

  issue(): Promise<string> {
    return this.jwtService.signAsync(
      { purpose: STATE_PURPOSE, nonce: randomBytes(16).toString('hex') },
      { secret: this.secret, expiresIn: STATE_LIFETIME_SECONDS },
    );
  }

  async assertValid(state: unknown): Promise<void> {
    if (typeof state !== 'string' || state.length === 0) {
      throw new UnauthorizedException('Missing OAuth state parameter');
    }
    try {
      const payload = await this.jwtService.verifyAsync<{ purpose?: string }>(
        state,
        { secret: this.secret },
      );
      if (payload.purpose !== STATE_PURPOSE) {
        throw new Error('wrong purpose');
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }
  }
}
