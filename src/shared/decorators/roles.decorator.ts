import { SetMetadata } from '@nestjs/common';
import { Role } from '../../domain-contracts';

export const ROLES_KEY = 'roles';

/** Restricts a route (or controller) to users having any of the given roles. */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
