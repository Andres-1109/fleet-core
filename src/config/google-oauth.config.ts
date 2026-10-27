import { ConfigService } from '@nestjs/config';

const PLACEHOLDER_PREFIX = 'your-';

/**
 * Google login is optional: it is enabled only when real credentials are set.
 * The placeholder values shipped in .env.example count as "not configured", so
 * the API still boots (and every other endpoint works) without Google.
 */
export function isGoogleOAuthConfigured(configService: ConfigService): boolean {
  return [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
  ].every((key) => {
    const value = configService.get<string>(key);
    return !!value && !value.startsWith(PLACEHOLDER_PREFIX);
  });
}
