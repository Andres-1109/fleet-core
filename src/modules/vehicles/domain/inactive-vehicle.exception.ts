import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class InactiveVehicleException extends DomainException {
  constructor(plate: string) {
    super(
      `Vehicle ${plate} is inactive; reactivate it by setting its status to AVAILABLE before making other changes`,
      DomainErrorType.CONFLICT,
    );
  }
}
