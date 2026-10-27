import { MaintenanceStatus, VehicleStatus } from '../../../domain-contracts';
import { InvalidStateTransitionException } from './invalid-state-transition.exception';

/** What entering a given status implies, beyond the status change itself. */
interface TransitionEffect {
  /** Closing fields (workPerformed, finalCost, finalMileage, finishedAt) are mandatory. */
  readonly requiresClosingDetails: boolean;
  /** New vehicle status given its current one, or null to leave it untouched. */
  readonly nextVehicleStatus: (current: VehicleStatus) => VehicleStatus | null;
}

/**
 * Allowed transitions. COMPLETED and CANCELLED are terminal states:
 *   SCHEDULED   → IN_PROGRESS | CANCELLED
 *   IN_PROGRESS → COMPLETED   | CANCELLED
 */
const ALLOWED_TRANSITIONS: Readonly<
  Record<MaintenanceStatus, readonly MaintenanceStatus[]>
> = {
  [MaintenanceStatus.SCHEDULED]: [
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.IN_PROGRESS]: [
    MaintenanceStatus.COMPLETED,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.COMPLETED]: [],
  [MaintenanceStatus.CANCELLED]: [],
};

/**
 * Side effects keyed by the target status:
 *   → IN_PROGRESS: vehicle becomes IN_MAINTENANCE.
 *   → COMPLETED:   vehicle becomes AVAILABLE; closing fields are required.
 *   → CANCELLED:   vehicle goes back to AVAILABLE only if it was IN_MAINTENANCE.
 */
const TRANSITION_EFFECTS: Readonly<
  Partial<Record<MaintenanceStatus, TransitionEffect>>
> = {
  [MaintenanceStatus.IN_PROGRESS]: {
    requiresClosingDetails: false,
    nextVehicleStatus: () => VehicleStatus.IN_MAINTENANCE,
  },
  [MaintenanceStatus.COMPLETED]: {
    requiresClosingDetails: true,
    nextVehicleStatus: () => VehicleStatus.AVAILABLE,
  },
  [MaintenanceStatus.CANCELLED]: {
    requiresClosingDetails: false,
    nextVehicleStatus: (current) =>
      current === VehicleStatus.IN_MAINTENANCE ? VehicleStatus.AVAILABLE : null,
  },
};

const NO_EFFECT: TransitionEffect = {
  requiresClosingDetails: false,
  nextVehicleStatus: () => null,
};

export const MaintenanceStateMachine = {
  canTransition(from: MaintenanceStatus, to: MaintenanceStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  },

  /** Throws InvalidStateTransitionException when `from → to` is not allowed. */
  assertTransition(from: MaintenanceStatus, to: MaintenanceStatus): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidStateTransitionException(from, to);
    }
  },

  requiresClosingDetails(to: MaintenanceStatus): boolean {
    return (TRANSITION_EFFECTS[to] ?? NO_EFFECT).requiresClosingDetails;
  },

  nextVehicleStatus(
    to: MaintenanceStatus,
    currentVehicleStatus: VehicleStatus,
  ): VehicleStatus | null {
    return (TRANSITION_EFFECTS[to] ?? NO_EFFECT).nextVehicleStatus(
      currentVehicleStatus,
    );
  },
} as const;
