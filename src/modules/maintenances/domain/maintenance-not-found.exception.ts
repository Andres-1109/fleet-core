import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class MaintenanceNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Maintenance with id ${id} not found`, DomainErrorType.NOT_FOUND);
  }
}
