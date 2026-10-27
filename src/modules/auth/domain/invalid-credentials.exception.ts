import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class InvalidCredentialsException extends DomainException {
  constructor() {
    // Deliberately generic: never reveal whether the email exists.
    super('Invalid email or password', DomainErrorType.UNAUTHORIZED);
  }
}
