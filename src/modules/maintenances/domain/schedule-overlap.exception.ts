import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class ScheduleOverlapException extends DomainException {
  constructor(mechanicLabel: string, conflictStart?: Date, conflictEnd?: Date) {
    const window =
      conflictStart && conflictEnd
        ? ` (${conflictStart.toISOString()} - ${conflictEnd.toISOString()})`
        : '';
    super(
      `Mechanic ${mechanicLabel} already has an active maintenance overlapping this schedule${window}`,
      DomainErrorType.CONFLICT,
    );
  }
}
