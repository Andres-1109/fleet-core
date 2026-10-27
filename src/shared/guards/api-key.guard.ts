import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';

const API_KEY_HEADER = 'x-api-key';

/**
 * Authenticates external integrations via the `x-api-key` header, checked
 * against the comma-separated API_KEYS environment variable.
 *
 * Use it together with @Public() on the route: the global JwtAuthGuard would
 * otherwise demand a bearer token as well.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly validKeyDigests: Buffer[];

  constructor(configService: ConfigService) {
    this.validKeyDigests = configService
      .getOrThrow<string>('API_KEYS')
      .split(',')
      .map((key) => key.trim())
      .filter((key) => key.length > 0)
      .map((key) => this.digest(key));
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const providedKey = request.headers[API_KEY_HEADER];

    if (typeof providedKey !== 'string' || !this.isValid(providedKey)) {
      throw new UnauthorizedException('Missing or invalid API key');
    }
    return true;
  }

  // Compare fixed-length digests in constant time to avoid leaking key
  // contents (or length) through response timing.
  private isValid(providedKey: string): boolean {
    const providedDigest = this.digest(providedKey);
    return this.validKeyDigests.some((validDigest) =>
      timingSafeEqual(validDigest, providedDigest),
    );
  }

  private digest(value: string): Buffer {
    return createHash('sha256').update(value).digest();
  }
}
