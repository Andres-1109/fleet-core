import { MaintenanceStatus } from '../../../../domain-contracts';
import {
  buildMaintenance,
  buildVehicle,
  mockMaintenanceRepository,
  mockVehicleRepository,
  VEHICLE_ID,
} from '../../../../shared/testing/repository-mocks';
import { RelatedResourceNotFoundException } from '../../domain/related-resource-not-found.exception';
import { FindActiveMaintenancesUseCase } from './find-active-maintenances.use-case';
import { FindAllMaintenancesUseCase } from './find-all-maintenances.use-case';
import { FindMaintenancesByVehicleUseCase } from './find-maintenances-by-vehicle.use-case';

// Thin list use cases of the maintenances module, grouped in one suite.
describe('Maintenance list use cases', () => {
  let maintenances: ReturnType<typeof mockMaintenanceRepository>;
  let vehicles: ReturnType<typeof mockVehicleRepository>;

  beforeEach(() => {
    maintenances = mockMaintenanceRepository();
    vehicles = mockVehicleRepository();
  });

  it('FindAllMaintenancesUseCase forwards the filters', async () => {
    await new FindAllMaintenancesUseCase(maintenances).execute({
      status: MaintenanceStatus.COMPLETED,
      vehicleId: VEHICLE_ID,
    });
    expect(maintenances.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        status: MaintenanceStatus.COMPLETED,
        vehicleId: VEHICLE_ID,
      }),
    );
  });

  it('FindActiveMaintenancesUseCase maps active records to entities', async () => {
    maintenances.findActive.mockResolvedValue([buildMaintenance()]);
    const result = await new FindActiveMaintenancesUseCase(
      maintenances,
    ).execute();
    expect(result.map((maintenance) => maintenance.status)).toEqual([
      MaintenanceStatus.SCHEDULED,
    ]);
  });

  it('FindMaintenancesByVehicleUseCase lists a known vehicle', async () => {
    vehicles.findById.mockResolvedValue(buildVehicle());
    maintenances.findByVehicle.mockResolvedValue([buildMaintenance()]);
    await expect(
      new FindMaintenancesByVehicleUseCase(maintenances, vehicles).execute(
        VEHICLE_ID,
      ),
    ).resolves.toHaveLength(1);
  });

  it('FindMaintenancesByVehicleUseCase reports an unknown vehicle', async () => {
    await expect(
      new FindMaintenancesByVehicleUseCase(maintenances, vehicles).execute(
        'missing',
      ),
    ).rejects.toThrow(RelatedResourceNotFoundException);
  });
});
