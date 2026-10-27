import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class VehicleInMaintenanceException extends DomainException {
  constructor(plate: string) {
    super(
      `Vehicle ${plate} is in maintenance; its status is managed by the maintenance lifecycle`,
      DomainErrorType.CONFLICT,
    );
  }
}
