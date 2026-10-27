import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class InvalidMileageException extends DomainException {
  constructor(field: string, provided: number, minimum: number) {
    super(
      `${field} (${String(provided)}) cannot be lower than ${String(minimum)}`,
      DomainErrorType.CONFLICT,
    );
  }
}
