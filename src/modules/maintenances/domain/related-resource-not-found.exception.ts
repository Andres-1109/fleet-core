import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class RelatedResourceNotFoundException extends DomainException {
  constructor(
    resource: 'Vehicle' | 'Mechanic' | 'Workshop',
    identifier: string,
  ) {
    super(`${resource} ${identifier} not found`, DomainErrorType.NOT_FOUND);
  }
}
