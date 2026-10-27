import { Role } from '../../../../domain-contracts';
import {
  buildMechanic,
  MECHANIC_ID,
  mockPasswordHasher,
  mockUserRepository,
} from '../../../../shared/testing/repository-mocks';
import { InvalidCredentialsException } from '../../domain/invalid-credentials.exception';
import { ITokenService } from '../ports/token-service.port';
import { LoginUserUseCase } from './login-user.use-case';

describe('LoginUserUseCase', () => {
  const credentials = { email: 'carlos@fleetcore.com', password: 'Secret123!' };
  let users: ReturnType<typeof mockUserRepository>;
  let tokens: jest.Mocked<ITokenService>;
  let useCase: LoginUserUseCase;

  beforeEach(() => {
    users = mockUserRepository();
    tokens = { sign: jest.fn().mockResolvedValue('signed.jwt.token') };
    users.findByEmail.mockResolvedValue(
      buildMechanic({ password: 'hashed:Secret123!' }),
    );
    useCase = new LoginUserUseCase(users, mockPasswordHasher(), tokens);
  });

  it('issues a token carrying the user id, email and role', async () => {
    const result = await useCase.execute(credentials);
    expect(tokens.sign).toHaveBeenCalledWith({
      sub: MECHANIC_ID,
      email: 'carlos@fleetcore.com',
      role: Role.MECHANIC,
    });
    expect(result).toMatchObject({
      accessToken: 'signed.jwt.token',
      tokenType: 'Bearer',
    });
    expect(result.user).not.toHaveProperty('password');
  });

  it.each([
    [
      'an unknown email',
      (): void => {
        users.findByEmail.mockResolvedValue(null);
      },
    ],
    [
      'a wrong password',
      (): void => {
        users.findByEmail.mockResolvedValue(
          buildMechanic({ password: 'hashed:Other' }),
        );
      },
    ],
    [
      'an inactive account',
      (): void => {
        users.findByEmail.mockResolvedValue(
          buildMechanic({ password: 'hashed:Secret123!', isActive: false }),
        );
      },
    ],
  ])('fails identically for %s', async (_label, arrange) => {
    arrange();
    await expect(useCase.execute(credentials)).rejects.toThrow(
      InvalidCredentialsException,
    );
    await expect(useCase.execute(credentials)).rejects.toThrow(
      'Invalid email or password',
    );
    expect(tokens.sign).not.toHaveBeenCalled();
  });
});
