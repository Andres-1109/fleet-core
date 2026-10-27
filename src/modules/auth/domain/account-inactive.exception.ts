import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class AccountInactiveException extends DomainException {
  constructor() {
    super('This account is inactive', DomainErrorType.FORBIDDEN);
  }
}
