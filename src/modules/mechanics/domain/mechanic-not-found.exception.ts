import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class MechanicNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Mechanic with id ${id} not found`, DomainErrorType.NOT_FOUND);
  }
}
