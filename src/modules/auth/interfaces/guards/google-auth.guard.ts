import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, AuthGuardAuthenticateOptions } from '@nestjs/passport';
import { isGoogleOAuthConfigured } from '../../../../config/google-oauth.config';
import { GoogleOAuthStateService } from '../../infrastructure/services/google-oauth-state.service';

interface GoogleOAuthRequest {
  path: string;
  query: Record<string, unknown>;
}

const CALLBACK_PATH_SUFFIX = '/callback';

/**
 * Drives both legs of the Google redirect flow:
 *  - start (GET /auth/google): attaches a signed `state` and redirects to Google;
 *  - callback (GET /auth/google/callback): verifies that `state` came back
 *    intact before letting Passport exchange the code for the profile.
 *
 * Fails with 503 when Google credentials are not configured, instead of
 * crashing the whole application at startup.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly stateService: GoogleOAuthStateService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!isGoogleOAuthConfigured(this.configService)) {
      throw new ServiceUnavailableException(
        'Google login is not configured on this server',
      );
    }

    if (this.isCallback(context)) {
      await this.stateService.assertValid(this.request(context).query.state);
    }
    return (await super.canActivate(context)) as boolean;
  }

  // Passport adds this `state` to the Google URL; only the start leg needs one.
  async getAuthenticateOptions(
    context: ExecutionContext,
  ): Promise<AuthGuardAuthenticateOptions> {
    return this.isCallback(context)
      ? {}
      : { state: await this.stateService.issue() };
  }

  private request(context: ExecutionContext): GoogleOAuthRequest {
    return context.switchToHttp().getRequest<GoogleOAuthRequest>();
  }

  private isCallback(context: ExecutionContext): boolean {
    return this.request(context).path.endsWith(CALLBACK_PATH_SUFFIX);
  }

  // Covers consent denied by the user and failed code exchanges.
  handleRequest<TUser>(error: unknown, user: TUser | false): TUser {
    if (error instanceof Error || !user) {
      throw new UnauthorizedException(
        'Google authentication failed or was cancelled',
      );
    }
    return user;
  }
}
