import { MaintenanceStatus } from '../../../domain-contracts';
import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class InvalidStateTransitionException extends DomainException {
  constructor(from: MaintenanceStatus, to: MaintenanceStatus) {
    super(
      `Invalid status transition from ${from} to ${to}`,
      DomainErrorType.CONFLICT,
    );
  }
}
