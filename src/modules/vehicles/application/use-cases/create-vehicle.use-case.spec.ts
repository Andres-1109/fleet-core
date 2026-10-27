import { VehicleStatus } from '../../../../domain-contracts';
import {
  buildVehicle,
  mockVehicleRepository,
} from '../../../../shared/testing/repository-mocks';
import { DuplicatePlateException } from '../../domain/duplicate-plate.exception';
import { CreateVehicleUseCase } from './create-vehicle.use-case';

describe('CreateVehicleUseCase', () => {
  const dto = {
    plate: 'XYZ999',
    brand: 'Kia',
    model: 'Rio',
    year: 2020,
    mileage: 10,
  };
  let vehicles: ReturnType<typeof mockVehicleRepository>;
  let useCase: CreateVehicleUseCase;

  beforeEach(() => {
    vehicles = mockVehicleRepository();
    vehicles.create.mockImplementation((data) =>
      Promise.resolve(buildVehicle(data)),
    );
    useCase = new CreateVehicleUseCase(vehicles);
  });

  it('always creates the vehicle as AVAILABLE', async () => {
    const vehicle = await useCase.execute(dto);
    expect(vehicles.create).toHaveBeenCalledWith({
      ...dto,
      status: VehicleStatus.AVAILABLE,
    });
    expect(vehicle.status).toBe(VehicleStatus.AVAILABLE);
  });

  it('rejects a plate that is already registered', async () => {
    vehicles.findByPlate.mockResolvedValue(buildVehicle({ plate: 'XYZ999' }));
    await expect(useCase.execute(dto)).rejects.toThrow(DuplicatePlateException);
    expect(vehicles.create).not.toHaveBeenCalled();
  });
});
