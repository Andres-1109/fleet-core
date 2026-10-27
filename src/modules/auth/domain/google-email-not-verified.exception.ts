import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class GoogleEmailNotVerifiedException extends DomainException {
  constructor() {
    super(
      'The Google account email is not verified, so it cannot be used to sign in',
      DomainErrorType.UNAUTHORIZED,
    );
  }
}
