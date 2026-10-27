import { Role } from '../../../../domain-contracts';
import {
  buildMechanic,
  MECHANIC_ID,
  mockUserRepository,
} from '../../../../shared/testing/repository-mocks';
import { MechanicNotFoundException } from '../../domain/mechanic-not-found.exception';
import { FindOneMechanicUseCase } from './find-one-mechanic.use-case';

describe('FindOneMechanicUseCase', () => {
  let users: ReturnType<typeof mockUserRepository>;
  let useCase: FindOneMechanicUseCase;

  beforeEach(() => {
    users = mockUserRepository();
    useCase = new FindOneMechanicUseCase(users);
  });

  it('returns a mechanic profile', async () => {
    users.findById.mockResolvedValue(buildMechanic());
    await expect(useCase.execute(MECHANIC_ID)).resolves.toMatchObject({
      id: MECHANIC_ID,
    });
  });

  it('hides users with another role behind a not-found error', async () => {
    users.findById.mockResolvedValue(buildMechanic({ role: Role.ADMIN }));
    await expect(useCase.execute(MECHANIC_ID)).rejects.toThrow(
      MechanicNotFoundException,
    );
  });

  it('reports an unknown id', async () => {
    await expect(useCase.execute('missing')).rejects.toThrow(
      MechanicNotFoundException,
    );
  });
});
