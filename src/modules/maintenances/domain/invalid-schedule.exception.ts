import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class InvalidScheduleException extends DomainException {
  constructor() {
    super(
      'scheduledEndDate must be later than scheduledStartDate',
      DomainErrorType.VALIDATION,
    );
  }
}
