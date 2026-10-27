import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class DuplicatePlateException extends DomainException {
  constructor(plate: string) {
    super(
      `A vehicle with plate ${plate} already exists`,
      DomainErrorType.CONFLICT,
    );
  }
}
