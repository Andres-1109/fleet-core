import {
  DomainErrorType,
  DomainException,
} from '../../../shared/exceptions/domain.exception';

export class MaintenanceModifiedConcurrentlyException extends DomainException {
  constructor(id: string) {
    super(
      `Maintenance ${id} was modified by another request; reload it and try again`,
      DomainErrorType.CONFLICT,
    );
  }
}
