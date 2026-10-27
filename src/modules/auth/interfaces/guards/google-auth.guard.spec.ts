import {
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { buildExecutionContext } from '../../../../shared/testing/execution-context';
import { GoogleOAuthStateService } from '../../infrastructure/services/google-oauth-state.service';
import { GoogleAuthGuard } from './google-auth.guard';

const REAL_CONFIG = {
  JWT_SECRET: 'test-secret',
  GOOGLE_CLIENT_ID: '123.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'GOCSPX-real',
  GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
};

function buildGuard(env: Record<string, string>): {
  guard: GoogleAuthGuard;
  states: GoogleOAuthStateService;
} {
  const config = new ConfigService(env);
  const states = new GoogleOAuthStateService(
    config,
    new JwtService({ secret: env.JWT_SECRET }),
  );
  return { guard: new GoogleAuthGuard(config, states), states };
}

const startContext = (): ExecutionContext =>
  buildExecutionContext({ request: { path: '/auth/google', query: {} } });
const callbackContext = (query: Record<string, unknown>): ExecutionContext =>
  buildExecutionContext({ request: { path: '/auth/google/callback', query } });

describe('GoogleAuthGuard', () => {
  describe('when Google credentials are not configured', () => {
    it.each([
      ['missing', {}],
      [
        'the .env.example placeholders',
        {
          GOOGLE_CLIENT_ID: 'your-google-client-id',
          GOOGLE_CLIENT_SECRET: 'your-google-client-secret',
          GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
        },
      ],
      [
        'only partly set',
        { GOOGLE_CLIENT_ID: '123.apps.googleusercontent.com' },
      ],
    ])('answers 503 when the settings are %s', async (_label, google) => {
      const { guard } = buildGuard({ JWT_SECRET: 'test-secret', ...google });
      await expect(guard.canActivate(startContext())).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(
        guard.canActivate(callbackContext({ code: 'x' })),
      ).rejects.toThrow('Google login is not configured on this server');
    });
  });

  describe('callback leg (credentials configured)', () => {
    const { guard } = buildGuard(REAL_CONFIG);

    it.each([
      ['no state', { code: 'abc' }],
      ['a forged state', { code: 'abc', state: 'forged' }],
    ])(
      'rejects a callback with %s before contacting Google',
      async (_label, query) => {
        await expect(guard.canActivate(callbackContext(query))).rejects.toThrow(
          UnauthorizedException,
        );
      },
    );
  });

  describe('start leg (credentials configured)', () => {
    it('attaches a fresh, verifiable state to the redirect options', async () => {
      const { guard, states } = buildGuard(REAL_CONFIG);
      const options = await guard.getAuthenticateOptions(startContext());
      await expect(states.assertValid(options.state)).resolves.toBeUndefined();
    });

    it('adds no state on the callback leg', async () => {
      const { guard } = buildGuard(REAL_CONFIG);
      await expect(
        guard.getAuthenticateOptions(callbackContext({})),
      ).resolves.toEqual({});
    });
  });

  describe('handleRequest', () => {
    const { guard } = buildGuard(REAL_CONFIG);

    it('returns the profile Passport extracted', () => {
      const profile = { email: 'a@b.com' };
      expect(guard.handleRequest(null, profile)).toBe(profile);
    });

    it.each([
      ['consent denied (no user)', null, false],
      ['a failed code exchange', new Error('invalid_grant'), false],
    ])('answers 401 for %s', (_label, error, user) => {
      expect(() => guard.handleRequest(error, user)).toThrow(
        'Google authentication failed or was cancelled',
      );
    });
  });
});
