import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class VehicleNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`Vehicle ${identifier} not found`, DomainErrorType.NOT_FOUND);
  }
}
