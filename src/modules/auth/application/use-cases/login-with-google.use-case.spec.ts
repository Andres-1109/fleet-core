import { Role } from '../../../../domain-contracts';
import {
  buildMechanic,
  MECHANIC_ID,
  mockPasswordHasher,
  mockUserRepository,
} from '../../../../shared/testing/repository-mocks';
import { AccountInactiveException } from '../../domain/account-inactive.exception';
import { GoogleEmailNotVerifiedException } from '../../domain/google-email-not-verified.exception';
import { UserAlreadyExistsException } from '../../domain/user-already-exists.exception';
import { GoogleProfile } from '../dtos/google-profile.dto';
import { ITokenService } from '../ports/token-service.port';
import { LoginWithGoogleUseCase } from './login-with-google.use-case';

const PROFILE: GoogleProfile = {
  email: 'New.Person@Gmail.com',
  name: 'New Person',
  emailVerified: true,
};

describe('LoginWithGoogleUseCase', () => {
  let users: ReturnType<typeof mockUserRepository>;
  let hasher: ReturnType<typeof mockPasswordHasher>;
  let tokens: jest.Mocked<ITokenService>;
  let useCase: LoginWithGoogleUseCase;

  beforeEach(() => {
    users = mockUserRepository();
    hasher = mockPasswordHasher();
    tokens = { sign: jest.fn().mockResolvedValue('signed.jwt.token') };
    users.create.mockImplementation((data) =>
      Promise.resolve(buildMechanic(data)),
    );
    useCase = new LoginWithGoogleUseCase(users, hasher, tokens);
  });

  describe('first login (no local account)', () => {
    it('creates an active MECHANIC with a normalized email and no specialty', async () => {
      await useCase.execute(PROFILE);
      expect(users.findByEmail).toHaveBeenCalledWith('new.person@gmail.com');
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Person',
          email: 'new.person@gmail.com',
          role: Role.MECHANIC,
          specialty: null,
          isActive: true,
        }),
      );
    });

    it('stores an unusable random password hash, never a known password', async () => {
      await useCase.execute(PROFILE);
      const stored = users.create.mock.calls[0][0].password;
      expect(stored).toMatch(/^hashed:[0-9a-f]{64}$/);
      // A second account gets different random bytes.
      await useCase.execute({ ...PROFILE, email: 'other@gmail.com' });
      expect(users.create.mock.calls[1][0].password).not.toBe(stored);
    });

    it('returns a token and a profile without the password', async () => {
      const result = await useCase.execute(PROFILE);
      expect(result).toMatchObject({
        accessToken: 'signed.jwt.token',
        tokenType: 'Bearer',
      });
      expect(result.user).not.toHaveProperty('password');
      expect(tokens.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new.person@gmail.com',
          role: Role.MECHANIC,
        }),
      );
    });

    it('caps the name at 100 characters and falls back to the email when empty', async () => {
      await useCase.execute({ ...PROFILE, name: 'x'.repeat(150) });
      expect(users.create.mock.calls[0][0].name).toHaveLength(100);
      await useCase.execute({ ...PROFILE, name: '   ' });
      expect(users.create.mock.calls[1][0].name).toBe('new.person@gmail.com');
    });
  });

  describe('returning user', () => {
    it('reuses the existing account without creating or hashing anything', async () => {
      users.findByEmail.mockResolvedValue(buildMechanic());
      const result = await useCase.execute(PROFILE);
      expect(users.create).not.toHaveBeenCalled();
      expect(hasher.hash).not.toHaveBeenCalled();
      expect(tokens.sign).toHaveBeenCalledWith({
        sub: MECHANIC_ID,
        email: 'carlos@fleetcore.com',
        role: Role.MECHANIC,
      });
      expect(result.user.id).toBe(MECHANIC_ID);
    });

    it('keeps the role of an existing ADMIN account', async () => {
      users.findByEmail.mockResolvedValue(buildMechanic({ role: Role.ADMIN }));
      await useCase.execute(PROFILE);
      expect(tokens.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.ADMIN }),
      );
    });

    it('refuses an inactive account', async () => {
      users.findByEmail.mockResolvedValue(buildMechanic({ isActive: false }));
      await expect(useCase.execute(PROFILE)).rejects.toThrow(
        AccountInactiveException,
      );
      expect(tokens.sign).not.toHaveBeenCalled();
    });
  });

  describe('unverified Google email', () => {
    it('is rejected before touching the database', async () => {
      await expect(
        useCase.execute({ ...PROFILE, emailVerified: false }),
      ).rejects.toThrow(GoogleEmailNotVerifiedException);
      expect(users.findByEmail).not.toHaveBeenCalled();
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('two first-time logins racing', () => {
    it('reuses the account created by the winner', async () => {
      users.findByEmail
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(buildMechanic());
      users.create.mockRejectedValue(
        new UserAlreadyExistsException('new.person@gmail.com'),
      );
      const result = await useCase.execute(PROFILE);
      expect(result.user.id).toBe(MECHANIC_ID);
    });

    it('rethrows other creation errors', async () => {
      users.create.mockRejectedValue(new Error('db down'));
      await expect(useCase.execute(PROFILE)).rejects.toThrow('db down');
    });
  });
});
