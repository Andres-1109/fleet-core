import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class MaintenanceAccessDeniedException extends DomainException {
  constructor() {
    super(
      'Mechanics can only access maintenances assigned to them',
      DomainErrorType.FORBIDDEN,
    );
  }
}
