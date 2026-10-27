import { VehicleStatus } from '../../../../domain-contracts';
import {
  buildVehicle,
  mockVehicleRepository,
  VEHICLE_ID,
} from '../../../../shared/testing/repository-mocks';
import { VehicleInMaintenanceException } from '../../domain/vehicle-in-maintenance.exception';
import { VehicleNotFoundException } from '../../domain/vehicle-not-found.exception';
import { DeactivateVehicleUseCase } from './deactivate-vehicle.use-case';

describe('DeactivateVehicleUseCase', () => {
  let vehicles: ReturnType<typeof mockVehicleRepository>;
  let useCase: DeactivateVehicleUseCase;

  beforeEach(() => {
    vehicles = mockVehicleRepository();
    vehicles.update.mockImplementation((_id, data) =>
      Promise.resolve(buildVehicle(data)),
    );
    useCase = new DeactivateVehicleUseCase(vehicles);
  });

  it('marks an AVAILABLE vehicle INACTIVE (logical deletion)', async () => {
    vehicles.findById.mockResolvedValue(buildVehicle());
    const vehicle = await useCase.execute(VEHICLE_ID);
    expect(vehicles.update).toHaveBeenCalledWith(VEHICLE_ID, {
      status: VehicleStatus.INACTIVE,
    });
    expect(vehicle.status).toBe(VehicleStatus.INACTIVE);
  });

  it('is a no-op for an already INACTIVE vehicle', async () => {
    vehicles.findById.mockResolvedValue(
      buildVehicle({ status: VehicleStatus.INACTIVE }),
    );
    await expect(useCase.execute(VEHICLE_ID)).resolves.toMatchObject({
      status: VehicleStatus.INACTIVE,
    });
    expect(vehicles.update).not.toHaveBeenCalled();
  });

  it('refuses to deactivate a vehicle in maintenance', async () => {
    vehicles.findById.mockResolvedValue(
      buildVehicle({ status: VehicleStatus.IN_MAINTENANCE }),
    );
    await expect(useCase.execute(VEHICLE_ID)).rejects.toThrow(
      VehicleInMaintenanceException,
    );
  });

  it('reports an unknown vehicle', async () => {
    await expect(useCase.execute('missing')).rejects.toThrow(
      VehicleNotFoundException,
    );
  });
});
