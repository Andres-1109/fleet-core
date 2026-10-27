import { MaintenanceStatus, VehicleStatus } from '../../../domain-contracts';
import { InvalidStateTransitionException } from './invalid-state-transition.exception';
import { MaintenanceStateMachine } from './maintenance-state-machine';

const { SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED } = MaintenanceStatus;
const ALL_STATUSES = [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED];

const VALID_TRANSITIONS: Array<[MaintenanceStatus, MaintenanceStatus]> = [
  [SCHEDULED, IN_PROGRESS],
  [SCHEDULED, CANCELLED],
  [IN_PROGRESS, COMPLETED],
  [IN_PROGRESS, CANCELLED],
];

// Every from→to pair that is not explicitly allowed (12 of the 16 combinations).
const INVALID_TRANSITIONS = ALL_STATUSES.flatMap((from) =>
  ALL_STATUSES.filter(
    (to) =>
      !VALID_TRANSITIONS.some(
        ([validFrom, validTo]) => validFrom === from && validTo === to,
      ),
  ).map((to): [MaintenanceStatus, MaintenanceStatus] => [from, to]),
);

describe('MaintenanceStateMachine', () => {
  describe('valid transitions', () => {
    it.each(VALID_TRANSITIONS)('allows %s -> %s', (from, to) => {
      expect(MaintenanceStateMachine.canTransition(from, to)).toBe(true);
      expect(() => {
        MaintenanceStateMachine.assertTransition(from, to);
      }).not.toThrow();
    });
  });

  describe('invalid transitions', () => {
    it('covers every combination that is not explicitly allowed', () => {
      expect(INVALID_TRANSITIONS).toHaveLength(12);
    });

    it.each(INVALID_TRANSITIONS)('rejects %s -> %s', (from, to) => {
      expect(MaintenanceStateMachine.canTransition(from, to)).toBe(false);
      expect(() => {
        MaintenanceStateMachine.assertTransition(from, to);
      }).toThrow(InvalidStateTransitionException);
    });

    it.each([COMPLETED, CANCELLED])('%s is terminal', (terminal) => {
      for (const to of ALL_STATUSES) {
        expect(MaintenanceStateMachine.canTransition(terminal, to)).toBe(false);
      }
    });

    it('names both statuses in the error message', () => {
      expect(() => {
        MaintenanceStateMachine.assertTransition(COMPLETED, IN_PROGRESS);
      }).toThrow('Invalid status transition from COMPLETED to IN_PROGRESS');
    });
  });

  describe('closing details', () => {
    it('are required only when completing', () => {
      expect(MaintenanceStateMachine.requiresClosingDetails(COMPLETED)).toBe(
        true,
      );
      for (const status of [SCHEDULED, IN_PROGRESS, CANCELLED]) {
        expect(MaintenanceStateMachine.requiresClosingDetails(status)).toBe(
          false,
        );
      }
    });
  });

  describe('vehicle side effects', () => {
    it('moves the vehicle to IN_MAINTENANCE when work starts', () => {
      expect(
        MaintenanceStateMachine.nextVehicleStatus(
          IN_PROGRESS,
          VehicleStatus.AVAILABLE,
        ),
      ).toBe(VehicleStatus.IN_MAINTENANCE);
    });

    it('releases the vehicle to AVAILABLE on completion', () => {
      expect(
        MaintenanceStateMachine.nextVehicleStatus(
          COMPLETED,
          VehicleStatus.IN_MAINTENANCE,
        ),
      ).toBe(VehicleStatus.AVAILABLE);
    });

    it('releases an IN_MAINTENANCE vehicle on cancellation', () => {
      expect(
        MaintenanceStateMachine.nextVehicleStatus(
          CANCELLED,
          VehicleStatus.IN_MAINTENANCE,
        ),
      ).toBe(VehicleStatus.AVAILABLE);
    });

    it.each([VehicleStatus.AVAILABLE, VehicleStatus.INACTIVE])(
      'leaves a %s vehicle untouched on cancellation',
      (vehicleStatus) => {
        expect(
          MaintenanceStateMachine.nextVehicleStatus(CANCELLED, vehicleStatus),
        ).toBeNull();
      },
    );

    it('has no vehicle effect for SCHEDULED', () => {
      expect(
        MaintenanceStateMachine.nextVehicleStatus(
          SCHEDULED,
          VehicleStatus.AVAILABLE,
        ),
      ).toBeNull();
    });
  });
});
