// Injection tokens for the repository ports. Symbols avoid string collisions
// and let application code depend on abstractions: @Inject(USER_REPOSITORY).
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const VEHICLE_REPOSITORY = Symbol('VEHICLE_REPOSITORY');
export const WORKSHOP_REPOSITORY = Symbol('WORKSHOP_REPOSITORY');
export const MAINTENANCE_REPOSITORY = Symbol('MAINTENANCE_REPOSITORY');
