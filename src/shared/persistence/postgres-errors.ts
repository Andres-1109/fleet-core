import { QueryFailedError } from 'typeorm';

const POSTGRES_UNIQUE_VIOLATION = '23505';

/** True when the error is a PostgreSQL unique-constraint violation. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
  );
}

const POSTGRES_EXCLUSION_VIOLATION = '23P01';

/** True when the error is a PostgreSQL exclusion-constraint violation. */
export function isExclusionViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code ===
      POSTGRES_EXCLUSION_VIOLATION
  );
}
