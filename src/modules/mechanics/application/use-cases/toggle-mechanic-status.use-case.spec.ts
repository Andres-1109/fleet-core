import {
  buildMechanic,
  MECHANIC_ID,
  mockUserRepository,
} from '../../../../shared/testing/repository-mocks';
import { MechanicNotFoundException } from '../../domain/mechanic-not-found.exception';
import { ToggleMechanicStatusUseCase } from './toggle-mechanic-status.use-case';

describe('ToggleMechanicStatusUseCase', () => {
  let users: ReturnType<typeof mockUserRepository>;
  let useCase: ToggleMechanicStatusUseCase;

  beforeEach(() => {
    users = mockUserRepository();
    users.update.mockImplementation((_id, data) =>
      Promise.resolve(buildMechanic(data)),
    );
    useCase = new ToggleMechanicStatusUseCase(users);
  });

  it.each([true, false])('flips isActive from %s', async (isActive) => {
    users.findById.mockResolvedValue(buildMechanic({ isActive }));
    const result = await useCase.execute(MECHANIC_ID);
    expect(users.update).toHaveBeenCalledWith(MECHANIC_ID, {
      isActive: !isActive,
    });
    expect(result.isActive).toBe(!isActive);
  });

  it('reports an unknown mechanic', async () => {
    await expect(useCase.execute('missing')).rejects.toThrow(
      MechanicNotFoundException,
    );
  });
});
