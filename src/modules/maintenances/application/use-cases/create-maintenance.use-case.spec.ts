import {
  MaintenanceStatus,
  MaintenanceType,
  Role,
  VehicleStatus,
} from '../../../../domain-contracts';
import { InactiveResourceException } from '../../domain/inactive-resource.exception';
import { InvalidMileageException } from '../../domain/invalid-mileage.exception';
import { InvalidScheduleException } from '../../domain/invalid-schedule.exception';
import { RelatedResourceNotFoundException } from '../../domain/related-resource-not-found.exception';
import { ScheduleOverlapException } from '../../domain/schedule-overlap.exception';
import { VehicleHasActiveMaintenanceException } from '../../domain/vehicle-has-active-maintenance.exception';
import {
  buildMaintenance,
  buildMechanic,
  buildVehicle,
  buildWorkshop,
  MECHANIC_ID,
  mockMaintenanceRepository,
  mockUserRepository,
  mockVehicleRepository,
  mockWorkshopRepository,
  VEHICLE_ID,
  WORKSHOP_ID,
} from '../../../../shared/testing/repository-mocks';
import { CreateMaintenanceDto } from '../dtos/create-maintenance.dto';
import { CreateMaintenanceUseCase } from './create-maintenance.use-case';

const at = (time: string): Date => new Date(`2026-11-10T${time}:00Z`);

function buildDto(
  overrides: Partial<CreateMaintenanceDto> = {},
): CreateMaintenanceDto {
  return {
    vehicleId: VEHICLE_ID,
    mechanicId: MECHANIC_ID,
    workshopId: WORKSHOP_ID,
    type: MaintenanceType.PREVENTIVE,
    description: 'Oil change',
    mileage: 1000,
    scheduledStartDate: at('10:00'),
    scheduledEndDate: at('12:00'),
    ...overrides,
  };
}

describe('CreateMaintenanceUseCase', () => {
  let maintenances: ReturnType<typeof mockMaintenanceRepository>;
  let vehicles: ReturnType<typeof mockVehicleRepository>;
  let users: ReturnType<typeof mockUserRepository>;
  let workshops: ReturnType<typeof mockWorkshopRepository>;
  let useCase: CreateMaintenanceUseCase;

  beforeEach(() => {
    maintenances = mockMaintenanceRepository();
    vehicles = mockVehicleRepository();
    users = mockUserRepository();
    workshops = mockWorkshopRepository();
    // Default world: every referenced resource exists, is active, and is free.
    vehicles.findById.mockResolvedValue(buildVehicle());
    users.findById.mockResolvedValue(buildMechanic());
    workshops.findById.mockResolvedValue(buildWorkshop());
    maintenances.create.mockImplementation((data) =>
      Promise.resolve(
        buildMaintenance({ ...data, status: MaintenanceStatus.SCHEDULED }),
      ),
    );
    useCase = new CreateMaintenanceUseCase(
      maintenances,
      vehicles,
      users,
      workshops,
    );
  });

  it('creates a SCHEDULED maintenance when every rule passes', async () => {
    const result = await useCase.execute(buildDto({ mileage: 1200 }));

    expect(result.status).toBe(MaintenanceStatus.SCHEDULED);
    expect(maintenances.create).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleId: VEHICLE_ID,
        mechanicId: MECHANIC_ID,
        workshopId: WORKSHOP_ID,
        mileage: 1200,
      }),
    );
  });

  describe('rejects', () => {
    // Every rejection must happen before anything is written.
    afterEach(() => {
      expect(maintenances.create).not.toHaveBeenCalled();
    });

    it('an INACTIVE vehicle', async () => {
      vehicles.findById.mockResolvedValue(
        buildVehicle({ status: VehicleStatus.INACTIVE }),
      );
      await expect(useCase.execute(buildDto())).rejects.toThrow(
        InactiveResourceException,
      );
      await expect(useCase.execute(buildDto())).rejects.toThrow(
        'Vehicle ABC123 is inactive',
      );
    });

    it('an inactive mechanic', async () => {
      users.findById.mockResolvedValue(buildMechanic({ isActive: false }));
      await expect(useCase.execute(buildDto())).rejects.toThrow(
        'Mechanic Carlos Mechanic is inactive',
      );
    });

    it('an inactive workshop', async () => {
      workshops.findById.mockResolvedValue(buildWorkshop({ isActive: false }));
      await expect(useCase.execute(buildDto())).rejects.toThrow(
        'Workshop Central Workshop is inactive',
      );
    });

    it('a mileage below the vehicle current mileage', async () => {
      await expect(useCase.execute(buildDto({ mileage: 999 }))).rejects.toThrow(
        InvalidMileageException,
      );
    });

    it('a vehicle that already has an active maintenance', async () => {
      maintenances.findActiveByVehicle.mockResolvedValue(
        buildMaintenance({
          id: 'other',
          status: MaintenanceStatus.IN_PROGRESS,
        }),
      );
      await expect(useCase.execute(buildDto())).rejects.toThrow(
        VehicleHasActiveMaintenanceException,
      );
    });

    it.each([
      ['starts inside', '11:00', '13:00'],
      ['ends inside', '09:00', '10:30'],
      ['encloses', '09:00', '13:00'],
    ])(
      'a schedule that %s the mechanic active booking',
      async (_label, start, end) => {
        maintenances.findActiveByMechanic.mockResolvedValue([
          buildMaintenance({ id: 'busy' }),
        ]);
        await expect(
          useCase.execute(
            buildDto({
              scheduledStartDate: at(start),
              scheduledEndDate: at(end),
            }),
          ),
        ).rejects.toThrow(ScheduleOverlapException);
      },
    );

    it('an end date that is not after the start date', async () => {
      await expect(
        useCase.execute(buildDto({ scheduledEndDate: at('10:00') })),
      ).rejects.toThrow(InvalidScheduleException);
    });

    it('a vehicle that does not exist', async () => {
      vehicles.findById.mockResolvedValue(null);
      await expect(useCase.execute(buildDto())).rejects.toThrow(
        RelatedResourceNotFoundException,
      );
    });

    it('a user that is not a mechanic', async () => {
      users.findById.mockResolvedValue(buildMechanic({ role: Role.ADMIN }));
      await expect(useCase.execute(buildDto())).rejects.toThrow(
        RelatedResourceNotFoundException,
      );
    });

    it('a workshop that does not exist', async () => {
      workshops.findById.mockResolvedValue(null);
      await expect(useCase.execute(buildDto())).rejects.toThrow(
        RelatedResourceNotFoundException,
      );
    });
  });

  describe('allows', () => {
    it('a schedule that starts exactly when the mechanic booking ends', async () => {
      maintenances.findActiveByMechanic.mockResolvedValue([
        buildMaintenance({ id: 'busy' }),
      ]);
      await expect(
        useCase.execute(
          buildDto({
            scheduledStartDate: at('12:00'),
            scheduledEndDate: at('14:00'),
          }),
        ),
      ).resolves.toBeDefined();
    });

    it('a mileage equal to the vehicle current mileage', async () => {
      await expect(
        useCase.execute(buildDto({ mileage: 1000 })),
      ).resolves.toBeDefined();
    });
  });
});
