import {
  buildVehicle,
  mockVehicleRepository,
} from '../../../../shared/testing/repository-mocks';
import { VehicleNotFoundException } from '../../domain/vehicle-not-found.exception';
import { FindVehicleUseCase } from './find-vehicle.use-case';

describe('FindVehicleUseCase', () => {
  const uuid = '3f2b8c1e-5a4d-4e7a-9c1b-2d8e6f0a1b2c';
  let vehicles: ReturnType<typeof mockVehicleRepository>;
  let useCase: FindVehicleUseCase;

  beforeEach(() => {
    vehicles = mockVehicleRepository();
    useCase = new FindVehicleUseCase(vehicles);
  });

  it('looks a UUID up by id', async () => {
    vehicles.findById.mockResolvedValue(buildVehicle({ id: uuid }));
    await expect(useCase.execute(uuid)).resolves.toMatchObject({ id: uuid });
    expect(vehicles.findByPlate).not.toHaveBeenCalled();
  });

  it('looks anything else up by normalized plate', async () => {
    vehicles.findByPlate.mockResolvedValue(buildVehicle());
    await useCase.execute('  abc123 ');
    expect(vehicles.findByPlate).toHaveBeenCalledWith('ABC123');
    expect(vehicles.findById).not.toHaveBeenCalled();
  });

  it('reports an unknown identifier', async () => {
    await expect(useCase.execute('NOPE1')).rejects.toThrow(
      VehicleNotFoundException,
    );
  });
});
