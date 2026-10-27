import { VehicleStatus } from '../../../../domain-contracts';
import {
  buildVehicle,
  mockVehicleRepository,
  VEHICLE_ID,
} from '../../../../shared/testing/repository-mocks';
import { DuplicatePlateException } from '../../domain/duplicate-plate.exception';
import { InactiveVehicleException } from '../../domain/inactive-vehicle.exception';
import { VehicleInMaintenanceException } from '../../domain/vehicle-in-maintenance.exception';
import { VehicleNotFoundException } from '../../domain/vehicle-not-found.exception';
import { UpdateVehicleUseCase } from './update-vehicle.use-case';

describe('UpdateVehicleUseCase', () => {
  let vehicles: ReturnType<typeof mockVehicleRepository>;
  let useCase: UpdateVehicleUseCase;

  const givenVehicle = (status: VehicleStatus): void => {
    vehicles.findById.mockResolvedValue(buildVehicle({ status }));
  };

  beforeEach(() => {
    vehicles = mockVehicleRepository();
    vehicles.update.mockImplementation((_id, data) =>
      Promise.resolve(buildVehicle(data)),
    );
    useCase = new UpdateVehicleUseCase(vehicles);
  });

  it('updates only the fields that were sent', async () => {
    givenVehicle(VehicleStatus.AVAILABLE);
    await useCase.execute(VEHICLE_ID, { mileage: 2000 });
    expect(vehicles.update).toHaveBeenCalledWith(VEHICLE_ID, { mileage: 2000 });
  });

  it('treats an empty body as a no-op', async () => {
    givenVehicle(VehicleStatus.AVAILABLE);
    await expect(useCase.execute(VEHICLE_ID, {})).resolves.toMatchObject({
      plate: 'ABC123',
    });
    expect(vehicles.update).not.toHaveBeenCalled();
  });

  it('allows deactivation through the status field', async () => {
    givenVehicle(VehicleStatus.AVAILABLE);
    await useCase.execute(VEHICLE_ID, { status: VehicleStatus.INACTIVE });
    expect(vehicles.update).toHaveBeenCalledWith(VEHICLE_ID, {
      status: VehicleStatus.INACTIVE,
    });
  });

  describe('INACTIVE vehicles', () => {
    beforeEach(() => {
      givenVehicle(VehicleStatus.INACTIVE);
    });

    it('reject edits that do not reactivate them', async () => {
      await expect(
        useCase.execute(VEHICLE_ID, { mileage: 2000 }),
      ).rejects.toThrow(InactiveVehicleException);
      expect(vehicles.update).not.toHaveBeenCalled();
    });

    it('accept reactivation together with other edits', async () => {
      await useCase.execute(VEHICLE_ID, {
        status: VehicleStatus.AVAILABLE,
        mileage: 2000,
      });
      expect(vehicles.update).toHaveBeenCalledWith(VEHICLE_ID, {
        status: VehicleStatus.AVAILABLE,
        mileage: 2000,
      });
    });
  });

  describe('IN_MAINTENANCE vehicles', () => {
    beforeEach(() => {
      givenVehicle(VehicleStatus.IN_MAINTENANCE);
    });

    it.each([VehicleStatus.AVAILABLE, VehicleStatus.INACTIVE] as const)(
      'reject a manual status change to %s',
      async (status) => {
        await expect(useCase.execute(VEHICLE_ID, { status })).rejects.toThrow(
          VehicleInMaintenanceException,
        );
      },
    );

    it('still accept data edits', async () => {
      await expect(
        useCase.execute(VEHICLE_ID, { brand: 'Toyota Motor' }),
      ).resolves.toBeDefined();
    });
  });

  it('rejects a plate owned by another vehicle', async () => {
    givenVehicle(VehicleStatus.AVAILABLE);
    vehicles.findByPlate.mockResolvedValue(
      buildVehicle({ id: 'other', plate: 'DEF456' }),
    );
    await expect(
      useCase.execute(VEHICLE_ID, { plate: 'DEF456' }),
    ).rejects.toThrow(DuplicatePlateException);
  });

  it('does not treat the vehicle own plate as a duplicate', async () => {
    givenVehicle(VehicleStatus.AVAILABLE);
    await useCase.execute(VEHICLE_ID, { plate: 'ABC123' });
    expect(vehicles.findByPlate).not.toHaveBeenCalled();
  });

  it('reports an unknown vehicle', async () => {
    await expect(useCase.execute('missing', { mileage: 1 })).rejects.toThrow(
      VehicleNotFoundException,
    );
  });
});
