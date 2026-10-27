import { Role } from '../../../../domain-contracts';
import {
  buildMechanic,
  mockPasswordHasher,
  mockUserRepository,
} from '../../../../shared/testing/repository-mocks';
import { UserAlreadyExistsException } from '../../domain/user-already-exists.exception';
import { RegisterUserUseCase } from './register-user.use-case';

describe('RegisterUserUseCase', () => {
  let users: ReturnType<typeof mockUserRepository>;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    users = mockUserRepository();
    users.create.mockImplementation((data) =>
      Promise.resolve(buildMechanic(data)),
    );
    useCase = new RegisterUserUseCase(users, mockPasswordHasher());
  });

  it('stores the hashed password, never the plain one', async () => {
    await useCase.execute({
      name: 'A',
      email: 'a@x.com',
      password: 'Secret123!',
      role: Role.MECHANIC,
      specialty: 'Engines',
    });
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'hashed:Secret123!',
        isActive: true,
      }),
    );
  });

  it('drops the specialty for an ADMIN', async () => {
    await useCase.execute({
      name: 'A',
      email: 'a@x.com',
      password: 'Secret123!',
      role: Role.ADMIN,
      specialty: 'Engines',
    });
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ specialty: null }),
    );
  });

  it('returns a profile without the password hash', async () => {
    const profile = await useCase.execute({
      name: 'A',
      email: 'a@x.com',
      password: 'Secret123!',
      role: Role.ADMIN,
    });
    expect(profile).not.toHaveProperty('password');
  });

  it('rejects an email that is already registered', async () => {
    users.findByEmail.mockResolvedValue(buildMechanic());
    await expect(
      useCase.execute({
        name: 'A',
        email: 'carlos@fleetcore.com',
        password: 'Secret123!',
        role: Role.ADMIN,
      }),
    ).rejects.toThrow(UserAlreadyExistsException);
    expect(users.create).not.toHaveBeenCalled();
  });
});
