import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../../../domain-contracts';
import {
  buildMechanic,
  MECHANIC_ID,
  mockUserRepository,
} from '../../../../shared/testing/repository-mocks';
import { TokenPayload } from '../../application/ports/token-service.port';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let users: ReturnType<typeof mockUserRepository>;
  let strategy: JwtStrategy;
  const payload: TokenPayload = {
    sub: MECHANIC_ID,
    email: 'c@x.com',
    role: Role.MECHANIC,
  };

  beforeEach(() => {
    users = mockUserRepository();
    strategy = new JwtStrategy(
      new ConfigService({ JWT_SECRET: 'test-secret' }),
      users,
    );
  });

  it('resolves the current user from the database, not from the token claims', async () => {
    users.findById.mockResolvedValue(buildMechanic({ role: Role.ADMIN }));
    await expect(strategy.validate(payload)).resolves.toEqual({
      id: MECHANIC_ID,
      email: 'carlos@fleetcore.com',
      role: Role.ADMIN,
    });
  });

  it('rejects a deactivated user even though the token is still valid', async () => {
    users.findById.mockResolvedValue(buildMechanic({ isActive: false }));
    await expect(strategy.validate(payload)).rejects.toThrow(
      'User is no longer active',
    );
  });

  it('rejects a token whose user no longer exists', async () => {
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it.each([
    ['missing', {}],
    ['empty', { sub: '' }],
    ['not a string', { sub: 42 }],
  ])(
    'rejects a payload whose subject is %s, without any lookup',
    async (_label, claims) => {
      await expect(
        strategy.validate(claims as unknown as TokenPayload),
      ).rejects.toThrow('Invalid token payload');
      expect(users.findById).not.toHaveBeenCalled();
    },
  );
});
