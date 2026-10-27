import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class InvalidClosingDetailsException extends DomainException {
  static missing(fields: string[]): InvalidClosingDetailsException {
    return new InvalidClosingDetailsException(
      `Completing a maintenance requires: ${fields.join(', ')}`,
    );
  }

  static notAllowed(): InvalidClosingDetailsException {
    return new InvalidClosingDetailsException(
      'workPerformed, finalCost, finalMileage and finishedAt are only allowed when completing a maintenance',
    );
  }

  private constructor(message: string) {
    super(message, DomainErrorType.VALIDATION);
  }
}
