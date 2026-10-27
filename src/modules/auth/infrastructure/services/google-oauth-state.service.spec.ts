import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GoogleOAuthStateService } from './google-oauth-state.service';

const JWT_SECRET = 'test-secret';

describe('GoogleOAuthStateService', () => {
  const jwt = new JwtService({ secret: JWT_SECRET });
  const service = new GoogleOAuthStateService(
    new ConfigService({ JWT_SECRET }),
    jwt,
  );

  it('accepts a state token it issued', async () => {
    await expect(
      service.assertValid(await service.issue()),
    ).resolves.toBeUndefined();
  });

  it('issues a different token every time', async () => {
    expect(await service.issue()).not.toBe(await service.issue());
  });

  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
    ['an array', ['a', 'b']],
    ['garbage', 'not-a-jwt'],
  ])('rejects %s', async (_label, state) => {
    await expect(service.assertValid(state)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an expired state', async () => {
    const expired = await new JwtService({}).signAsync(
      { purpose: 'google-oauth-state' },
      { secret: `${JWT_SECRET}:google-oauth-state`, expiresIn: -10 },
    );
    await expect(service.assertValid(expired)).rejects.toThrow(
      'Invalid or expired OAuth state',
    );
  });

  it('rejects a token signed with the plain access-token secret', async () => {
    const forged = await jwt.signAsync({ purpose: 'google-oauth-state' });
    await expect(service.assertValid(forged)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a correctly signed token with the wrong purpose', async () => {
    const wrongPurpose = await jwt.signAsync(
      { purpose: 'something-else' },
      { secret: `${JWT_SECRET}:google-oauth-state` },
    );
    await expect(service.assertValid(wrongPurpose)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('is not a usable access token: it has no subject and a different secret', async () => {
    const state = await service.issue();
    // Verifying it with the access-token secret must fail...
    await expect(jwt.verifyAsync(state)).rejects.toThrow();
    // ...and it carries no `sub` that could identify a user.
    expect(jwt.decode<{ sub?: string }>(state).sub).toBeUndefined();
  });
});
