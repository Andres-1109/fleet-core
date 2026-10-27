import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class WorkshopNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Workshop with id ${id} not found`, DomainErrorType.NOT_FOUND);
  }
}
