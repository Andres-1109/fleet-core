/**
 * Categories of business errors. The global exception filter maps each
 * category to an HTTP status code, so the domain layer never depends on HTTP.
 */
export enum DomainErrorType {
  VALIDATION = 'VALIDATION',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
}

/**
 * Base class for every domain exception. Pure TypeScript — no framework imports —
 * so it can be safely extended from any module's domain layer.
 */
export abstract class DomainException extends Error {
  protected constructor(
    message: string,
    public readonly type: DomainErrorType,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
