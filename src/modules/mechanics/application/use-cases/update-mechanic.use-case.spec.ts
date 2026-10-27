import { Role } from '../../../../domain-contracts';
import {
  buildMechanic,
  MECHANIC_ID,
  mockUserRepository,
} from '../../../../shared/testing/repository-mocks';
import { MechanicEmailInUseException } from '../../domain/mechanic-email-in-use.exception';
import { MechanicNotFoundException } from '../../domain/mechanic-not-found.exception';
import { UpdateMechanicUseCase } from './update-mechanic.use-case';

describe('UpdateMechanicUseCase', () => {
  let users: ReturnType<typeof mockUserRepository>;
  let useCase: UpdateMechanicUseCase;

  beforeEach(() => {
    users = mockUserRepository();
    users.findById.mockResolvedValue(buildMechanic());
    users.update.mockImplementation((_id, data) =>
      Promise.resolve(buildMechanic(data)),
    );
    useCase = new UpdateMechanicUseCase(users);
  });

  it('updates only the fields that were sent', async () => {
    await useCase.execute(MECHANIC_ID, { specialty: 'Transmissions' });
    expect(users.update).toHaveBeenCalledWith(MECHANIC_ID, {
      specialty: 'Transmissions',
    });
  });

  it('treats an empty body as a no-op', async () => {
    await useCase.execute(MECHANIC_ID, {});
    expect(users.update).not.toHaveBeenCalled();
  });

  it('rejects an email owned by another user', async () => {
    users.findByEmail.mockResolvedValue(buildMechanic({ id: 'other' }));
    await expect(
      useCase.execute(MECHANIC_ID, { email: 'taken@x.com' }),
    ).rejects.toThrow(MechanicEmailInUseException);
  });

  it('accepts re-sending the mechanic own email', async () => {
    await useCase.execute(MECHANIC_ID, { email: 'carlos@fleetcore.com' });
    expect(users.findByEmail).not.toHaveBeenCalled();
  });

  it('refuses to update a user that is not a mechanic', async () => {
    users.findById.mockResolvedValue(buildMechanic({ role: Role.ADMIN }));
    await expect(useCase.execute(MECHANIC_ID, { name: 'X' })).rejects.toThrow(
      MechanicNotFoundException,
    );
  });
});
