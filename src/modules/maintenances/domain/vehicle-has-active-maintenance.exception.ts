import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class VehicleHasActiveMaintenanceException extends DomainException {
  constructor(vehicleLabel: string) {
    super(
      `Vehicle ${vehicleLabel} already has an active maintenance`,
      DomainErrorType.CONFLICT,
    );
  }
}
