// The auth module uses the shared contract as-is; re-exported so use cases
// keep a module-local import path.
export type { IUserRepository } from '../../../../domain-contracts';
