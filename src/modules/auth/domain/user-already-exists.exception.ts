import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class UserAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`User with email ${email} already exists`, DomainErrorType.CONFLICT);
  }
}
