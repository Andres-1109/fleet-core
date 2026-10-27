import { Role } from '../../../../domain-contracts';
import {
  buildWorkshop,
  mockWorkshopRepository,
} from '../../../../shared/testing/repository-mocks';
import { FindAllWorkshopsUseCase } from './find-all-workshops.use-case';

describe('FindAllWorkshopsUseCase', () => {
  let workshops: ReturnType<typeof mockWorkshopRepository>;
  let useCase: FindAllWorkshopsUseCase;

  beforeEach(() => {
    workshops = mockWorkshopRepository();
    workshops.findAll.mockResolvedValue([buildWorkshop()]);
    useCase = new FindAllWorkshopsUseCase(workshops);
  });

  it('returns only active workshops by default', async () => {
    await useCase.execute({}, Role.ADMIN);
    expect(workshops.findAll).toHaveBeenCalledWith({ isActive: true });
  });

  it('lets an ADMIN include inactive workshops', async () => {
    await useCase.execute({ includeInactive: true }, Role.ADMIN);
    expect(workshops.findAll).toHaveBeenCalledWith(undefined);
  });

  it('ignores includeInactive for a MECHANIC', async () => {
    await useCase.execute({ includeInactive: true }, Role.MECHANIC);
    expect(workshops.findAll).toHaveBeenCalledWith({ isActive: true });
  });
});
