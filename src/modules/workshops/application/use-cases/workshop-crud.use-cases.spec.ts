import {
  buildWorkshop,
  mockWorkshopRepository,
  WORKSHOP_ID,
} from '../../../../shared/testing/repository-mocks';
import { WorkshopNotFoundException } from '../../domain/workshop-not-found.exception';
import { CreateWorkshopUseCase } from './create-workshop.use-case';
import { FindOneWorkshopUseCase } from './find-one-workshop.use-case';
import { ToggleWorkshopStatusUseCase } from './toggle-workshop-status.use-case';
import { UpdateWorkshopUseCase } from './update-workshop.use-case';

// Thin CRUD use cases of the workshops module, grouped in one suite.
describe('Workshop CRUD use cases', () => {
  let workshops: ReturnType<typeof mockWorkshopRepository>;

  beforeEach(() => {
    workshops = mockWorkshopRepository();
    workshops.create.mockImplementation((data) =>
      Promise.resolve(buildWorkshop(data)),
    );
    workshops.update.mockImplementation((_id, data) =>
      Promise.resolve(buildWorkshop(data)),
    );
  });

  it('CreateWorkshopUseCase always creates an active workshop', async () => {
    await new CreateWorkshopUseCase(workshops).execute({
      name: 'South',
      address: 'Av 1',
    });
    expect(workshops.create).toHaveBeenCalledWith({
      name: 'South',
      address: 'Av 1',
      isActive: true,
    });
  });

  it('FindOneWorkshopUseCase reports an unknown id', async () => {
    await expect(
      new FindOneWorkshopUseCase(workshops).execute('missing'),
    ).rejects.toThrow(WorkshopNotFoundException);
  });

  it('UpdateWorkshopUseCase sends only the provided fields', async () => {
    workshops.findById.mockResolvedValue(buildWorkshop());
    await new UpdateWorkshopUseCase(workshops).execute(WORKSHOP_ID, {
      address: 'New 2',
    });
    expect(workshops.update).toHaveBeenCalledWith(WORKSHOP_ID, {
      address: 'New 2',
    });
  });

  it('UpdateWorkshopUseCase treats an empty body as a no-op', async () => {
    workshops.findById.mockResolvedValue(buildWorkshop());
    await new UpdateWorkshopUseCase(workshops).execute(WORKSHOP_ID, {});
    expect(workshops.update).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'ToggleWorkshopStatusUseCase flips isActive from %s',
    async (isActive) => {
      workshops.findById.mockResolvedValue(buildWorkshop({ isActive }));
      const result = await new ToggleWorkshopStatusUseCase(workshops).execute(
        WORKSHOP_ID,
      );
      expect(result.isActive).toBe(!isActive);
    },
  );
});
