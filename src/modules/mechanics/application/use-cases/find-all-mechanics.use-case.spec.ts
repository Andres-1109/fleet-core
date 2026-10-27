import { Role } from '../../../../domain-contracts';
import {
  buildMechanic,
  mockUserRepository,
} from '../../../../shared/testing/repository-mocks';
import { FindAllMechanicsUseCase } from './find-all-mechanics.use-case';

describe('FindAllMechanicsUseCase', () => {
  it('lists only MECHANIC users, without password hashes', async () => {
    const users = mockUserRepository();
    users.findAllByRole.mockResolvedValue([buildMechanic()]);

    const result = await new FindAllMechanicsUseCase(users).execute();

    expect(users.findAllByRole).toHaveBeenCalledWith(Role.MECHANIC);
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('password');
  });
});
