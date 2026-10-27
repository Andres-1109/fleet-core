import { Role } from '../../../../domain-contracts';
import {
  buildMechanic,
  mockPasswordHasher,
  mockUserRepository,
} from '../../../../shared/testing/repository-mocks';
import { MechanicEmailInUseException } from '../../domain/mechanic-email-in-use.exception';
import { CreateMechanicUseCase } from './create-mechanic.use-case';

describe('CreateMechanicUseCase', () => {
  const dto = {
    name: 'Lia',
    email: 'lia@x.com',
    password: 'Secret123!',
    specialty: 'Tires',
  };
  let users: ReturnType<typeof mockUserRepository>;
  let useCase: CreateMechanicUseCase;

  beforeEach(() => {
    users = mockUserRepository();
    users.create.mockImplementation((data) =>
      Promise.resolve(buildMechanic(data)),
    );
    useCase = new CreateMechanicUseCase(users, mockPasswordHasher());
  });

  it('creates an active MECHANIC with a hashed password', async () => {
    await useCase.execute(dto);
    expect(users.create).toHaveBeenCalledWith({
      name: 'Lia',
      email: 'lia@x.com',
      password: 'hashed:Secret123!',
      role: Role.MECHANIC,
      specialty: 'Tires',
      isActive: true,
    });
  });

  it('never returns the password hash', async () => {
    expect(await useCase.execute(dto)).not.toHaveProperty('password');
  });

  it('rejects an email already in use', async () => {
    users.findByEmail.mockResolvedValue(buildMechanic());
    await expect(useCase.execute(dto)).rejects.toThrow(
      MechanicEmailInUseException,
    );
    expect(users.create).not.toHaveBeenCalled();
  });
});
