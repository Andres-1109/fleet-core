import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class MechanicEmailInUseException extends DomainException {
  constructor(email: string) {
    super(`Email ${email} is already in use`, DomainErrorType.CONFLICT);
  }
}
