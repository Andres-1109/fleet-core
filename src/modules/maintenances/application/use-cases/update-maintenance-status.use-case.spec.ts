import {
  AuthenticatedUser,
  MaintenanceStatus,
  Role,
  StatusUpdateCommand,
  VehicleStatus,
} from '../../../../domain-contracts';
import { InactiveResourceException } from '../../domain/inactive-resource.exception';
import { InvalidClosingDetailsException } from '../../domain/invalid-closing-details.exception';
import { InvalidMileageException } from '../../domain/invalid-mileage.exception';
import { InvalidStateTransitionException } from '../../domain/invalid-state-transition.exception';
import { MaintenanceAccessDeniedException } from '../../domain/maintenance-access-denied.exception';
import { MaintenanceModifiedConcurrentlyException } from '../../domain/maintenance-modified-concurrently.exception';
import { MaintenanceNotFoundException } from '../../domain/maintenance-not-found.exception';
import {
  buildMaintenance,
  buildVehicle,
  MAINTENANCE_ID,
  MECHANIC_ID,
  mockMaintenanceRepository,
  mockVehicleRepository,
  OTHER_MECHANIC_ID,
  VEHICLE_ID,
} from '../../../../shared/testing/repository-mocks';
import { UpdateMaintenanceStatusDto } from '../dtos/update-maintenance-status.dto';
import { UpdateMaintenanceStatusUseCase } from './update-maintenance-status.use-case';

const ADMIN: AuthenticatedUser = {
  id: 'admin-1',
  email: 'a@x.com',
  role: Role.ADMIN,
};
const ASSIGNED_MECHANIC: AuthenticatedUser = {
  id: MECHANIC_ID,
  email: 'm1@x.com',
  role: Role.MECHANIC,
};
const OTHER_MECHANIC: AuthenticatedUser = {
  id: OTHER_MECHANIC_ID,
  email: 'm2@x.com',
  role: Role.MECHANIC,
};

const CLOSING_DETAILS = {
  workPerformed: 'Oil and filter change',
  finalCost: 150.5,
  finalMileage: 1300,
  finishedAt: new Date('2026-11-10T11:45:00Z'),
};

describe('UpdateMaintenanceStatusUseCase', () => {
  let maintenances: ReturnType<typeof mockMaintenanceRepository>;
  let vehicles: ReturnType<typeof mockVehicleRepository>;
  let useCase: UpdateMaintenanceStatusUseCase;

  /** Arranges the current maintenance and vehicle state for one test. */
  function given(
    maintenanceStatus: MaintenanceStatus,
    vehicleStatus: VehicleStatus,
  ): void {
    maintenances.findById.mockResolvedValue(
      buildMaintenance({ status: maintenanceStatus }),
    );
    vehicles.findById.mockResolvedValue(
      buildVehicle({ status: vehicleStatus }),
    );
  }

  /** The command sent to the repository (status change + vehicle sync). */
  function sentCommand(): StatusUpdateCommand {
    expect(maintenances.updateStatus).toHaveBeenCalledTimes(1);
    return maintenances.updateStatus.mock.calls[0][0];
  }

  const run = (
    dto: UpdateMaintenanceStatusDto,
    requester: AuthenticatedUser = ADMIN,
  ): Promise<unknown> => useCase.execute(MAINTENANCE_ID, dto, requester);

  beforeEach(() => {
    maintenances = mockMaintenanceRepository();
    vehicles = mockVehicleRepository();
    maintenances.updateStatus.mockImplementation((command) =>
      Promise.resolve(buildMaintenance({ ...command.change })),
    );
    useCase = new UpdateMaintenanceStatusUseCase(maintenances, vehicles);
  });

  describe('closing details for COMPLETED', () => {
    beforeEach(() => {
      given(MaintenanceStatus.IN_PROGRESS, VehicleStatus.IN_MAINTENANCE);
    });

    it('rejects completion without any closing field', async () => {
      await expect(
        run({ status: MaintenanceStatus.COMPLETED }),
      ).rejects.toThrow(
        'Completing a maintenance requires: workPerformed, finalCost, finalMileage, finishedAt',
      );
      expect(maintenances.updateStatus).not.toHaveBeenCalled();
    });

    it.each(Object.keys(CLOSING_DETAILS))(
      'rejects completion without %s',
      async (field) => {
        const partial = { ...CLOSING_DETAILS, [field]: undefined };
        await expect(
          run({ status: MaintenanceStatus.COMPLETED, ...partial }),
        ).rejects.toThrow(InvalidClosingDetailsException);
        expect(maintenances.updateStatus).not.toHaveBeenCalled();
      },
    );

    it('rejects a final mileage below the maintenance mileage', async () => {
      await expect(
        run({
          status: MaintenanceStatus.COMPLETED,
          ...CLOSING_DETAILS,
          finalMileage: 999,
        }),
      ).rejects.toThrow(InvalidMileageException);
    });

    it('stores every closing field when completing', async () => {
      await run({ status: MaintenanceStatus.COMPLETED, ...CLOSING_DETAILS });
      expect(sentCommand().change).toEqual({
        status: MaintenanceStatus.COMPLETED,
        ...CLOSING_DETAILS,
      });
    });

    it('rejects closing fields on a non-completing transition', async () => {
      await expect(
        run({ status: MaintenanceStatus.CANCELLED, finalCost: 10 }),
      ).rejects.toThrow(InvalidClosingDetailsException);
    });
  });

  describe('vehicle status side effects', () => {
    it('SCHEDULED -> IN_PROGRESS puts the vehicle IN_MAINTENANCE', async () => {
      given(MaintenanceStatus.SCHEDULED, VehicleStatus.AVAILABLE);
      await run({ status: MaintenanceStatus.IN_PROGRESS });
      expect(sentCommand().vehicleSync).toEqual({
        vehicleId: VEHICLE_ID,
        status: VehicleStatus.IN_MAINTENANCE,
        mileage: undefined,
      });
    });

    it('IN_PROGRESS -> COMPLETED makes the vehicle AVAILABLE and advances its mileage', async () => {
      given(MaintenanceStatus.IN_PROGRESS, VehicleStatus.IN_MAINTENANCE);
      await run({ status: MaintenanceStatus.COMPLETED, ...CLOSING_DETAILS });
      expect(sentCommand().vehicleSync).toEqual({
        vehicleId: VEHICLE_ID,
        status: VehicleStatus.AVAILABLE,
        mileage: 1300,
      });
    });

    it('never lowers the vehicle mileage on completion', async () => {
      maintenances.findById.mockResolvedValue(
        buildMaintenance({ status: MaintenanceStatus.IN_PROGRESS }),
      );
      vehicles.findById.mockResolvedValue(
        buildVehicle({ status: VehicleStatus.IN_MAINTENANCE, mileage: 5000 }),
      );
      await run({ status: MaintenanceStatus.COMPLETED, ...CLOSING_DETAILS });
      expect(sentCommand().vehicleSync?.mileage).toBe(5000);
    });

    it('IN_PROGRESS -> CANCELLED releases the vehicle to AVAILABLE', async () => {
      given(MaintenanceStatus.IN_PROGRESS, VehicleStatus.IN_MAINTENANCE);
      await run({ status: MaintenanceStatus.CANCELLED });
      expect(sentCommand().vehicleSync?.status).toBe(VehicleStatus.AVAILABLE);
    });

    it('SCHEDULED -> CANCELLED leaves an AVAILABLE vehicle untouched', async () => {
      given(MaintenanceStatus.SCHEDULED, VehicleStatus.AVAILABLE);
      await run({ status: MaintenanceStatus.CANCELLED });
      expect(sentCommand().vehicleSync).toBeNull();
    });

    it('refuses to start work on a vehicle deactivated after scheduling', async () => {
      given(MaintenanceStatus.SCHEDULED, VehicleStatus.INACTIVE);
      await expect(
        run({ status: MaintenanceStatus.IN_PROGRESS }),
      ).rejects.toThrow(InactiveResourceException);
      expect(maintenances.updateStatus).not.toHaveBeenCalled();
    });

    it('guards the write with the status it validated against', async () => {
      given(MaintenanceStatus.SCHEDULED, VehicleStatus.AVAILABLE);
      await run({ status: MaintenanceStatus.IN_PROGRESS });
      expect(sentCommand().expectedStatus).toBe(MaintenanceStatus.SCHEDULED);
    });
  });

  describe('transition and access rules', () => {
    it('rejects an invalid transition without writing', async () => {
      given(MaintenanceStatus.COMPLETED, VehicleStatus.AVAILABLE);
      await expect(
        run({ status: MaintenanceStatus.IN_PROGRESS }),
      ).rejects.toThrow(InvalidStateTransitionException);
      expect(maintenances.updateStatus).not.toHaveBeenCalled();
    });

    it('lets the assigned mechanic change the status', async () => {
      given(MaintenanceStatus.SCHEDULED, VehicleStatus.AVAILABLE);
      await expect(
        run({ status: MaintenanceStatus.IN_PROGRESS }, ASSIGNED_MECHANIC),
      ).resolves.toBeDefined();
    });

    it('forbids a mechanic who is not assigned', async () => {
      given(MaintenanceStatus.SCHEDULED, VehicleStatus.AVAILABLE);
      await expect(
        run({ status: MaintenanceStatus.IN_PROGRESS }, OTHER_MECHANIC),
      ).rejects.toThrow(MaintenanceAccessDeniedException);
    });

    it('reports a missing maintenance', async () => {
      await expect(
        run({ status: MaintenanceStatus.CANCELLED }),
      ).rejects.toThrow(MaintenanceNotFoundException);
    });

    it('reports a concurrent modification when the guarded write matches nothing', async () => {
      given(MaintenanceStatus.SCHEDULED, VehicleStatus.AVAILABLE);
      maintenances.updateStatus.mockResolvedValue(null);
      await expect(
        run({ status: MaintenanceStatus.CANCELLED }),
      ).rejects.toThrow(MaintenanceModifiedConcurrentlyException);
    });
  });
});
