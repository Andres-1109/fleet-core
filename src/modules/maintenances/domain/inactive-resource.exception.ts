import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class InactiveResourceException extends DomainException {
  constructor(resource: 'Vehicle' | 'Mechanic' | 'Workshop', label: string) {
    super(
      `${resource} ${label} is inactive and cannot be assigned to a maintenance`,
      DomainErrorType.CONFLICT,
    );
  }
}
