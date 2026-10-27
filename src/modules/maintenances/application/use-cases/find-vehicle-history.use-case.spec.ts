import {
  buildMaintenance,
  buildVehicle,
  mockMaintenanceRepository,
  mockVehicleRepository,
  VEHICLE_ID,
} from '../../../../shared/testing/repository-mocks';
import { RelatedResourceNotFoundException } from '../../domain/related-resource-not-found.exception';
import { FindVehicleHistoryUseCase } from './find-vehicle-history.use-case';

describe('FindVehicleHistoryUseCase', () => {
  let maintenances: ReturnType<typeof mockMaintenanceRepository>;
  let vehicles: ReturnType<typeof mockVehicleRepository>;
  let useCase: FindVehicleHistoryUseCase;

  beforeEach(() => {
    maintenances = mockMaintenanceRepository();
    vehicles = mockVehicleRepository();
    useCase = new FindVehicleHistoryUseCase(maintenances, vehicles);
  });

  it('returns the vehicle and its maintenances, looked up by normalized plate', async () => {
    vehicles.findByPlate.mockResolvedValue(buildVehicle());
    maintenances.findByVehicle.mockResolvedValue([buildMaintenance()]);

    const history = await useCase.execute(' abc123 ');

    expect(vehicles.findByPlate).toHaveBeenCalledWith('ABC123');
    expect(maintenances.findByVehicle).toHaveBeenCalledWith(VEHICLE_ID);
    expect(history.vehicle.plate).toBe('ABC123');
    expect(history.maintenances).toHaveLength(1);
  });

  it('reports an unknown plate', async () => {
    await expect(useCase.execute('ZZZ999')).rejects.toThrow(
      RelatedResourceNotFoundException,
    );
  });
});
