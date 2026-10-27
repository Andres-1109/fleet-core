import { AuthenticatedUser, Role } from '../../../../domain-contracts';
import {
  buildMaintenance,
  buildMechanic,
  MECHANIC_ID,
  mockMaintenanceRepository,
  mockUserRepository,
  OTHER_MECHANIC_ID,
} from '../../../../shared/testing/repository-mocks';
import { MaintenanceAccessDeniedException } from '../../domain/maintenance-access-denied.exception';
import { RelatedResourceNotFoundException } from '../../domain/related-resource-not-found.exception';
import { FindMaintenancesByMechanicUseCase } from './find-maintenances-by-mechanic.use-case';

describe('FindMaintenancesByMechanicUseCase', () => {
  const admin: AuthenticatedUser = {
    id: 'admin',
    email: 'a@x.com',
    role: Role.ADMIN,
  };
  const mechanic: AuthenticatedUser = {
    id: MECHANIC_ID,
    email: 'm@x.com',
    role: Role.MECHANIC,
  };
  let maintenances: ReturnType<typeof mockMaintenanceRepository>;
  let users: ReturnType<typeof mockUserRepository>;
  let useCase: FindMaintenancesByMechanicUseCase;

  beforeEach(() => {
    maintenances = mockMaintenanceRepository();
    users = mockUserRepository();
    users.findById.mockResolvedValue(buildMechanic());
    maintenances.findByMechanic.mockResolvedValue([buildMaintenance()]);
    useCase = new FindMaintenancesByMechanicUseCase(maintenances, users);
  });

  it('lets a mechanic read their own maintenances', async () => {
    await expect(useCase.execute(MECHANIC_ID, mechanic)).resolves.toHaveLength(
      1,
    );
  });

  it("forbids a mechanic from reading another mechanic's maintenances", async () => {
    await expect(useCase.execute(OTHER_MECHANIC_ID, mechanic)).rejects.toThrow(
      MaintenanceAccessDeniedException,
    );
    expect(maintenances.findByMechanic).not.toHaveBeenCalled();
  });

  it('lets an admin read any mechanic', async () => {
    await expect(useCase.execute(MECHANIC_ID, admin)).resolves.toHaveLength(1);
  });

  it('reports an id that is not a mechanic', async () => {
    users.findById.mockResolvedValue(buildMechanic({ role: Role.ADMIN }));
    await expect(useCase.execute(MECHANIC_ID, admin)).rejects.toThrow(
      RelatedResourceNotFoundException,
    );
  });
});
