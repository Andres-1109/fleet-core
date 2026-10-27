import { Role } from './enums/role.enum';

/** Identity attached to the request once a JWT has been validated. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}
