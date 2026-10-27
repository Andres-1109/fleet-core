import { Role } from '../enums/role.enum';

/** Persisted shape of a user, shared across modules. */
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  specialty: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserData = Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserData = Partial<CreateUserData>;

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  /** Lists users with the given role (e.g. MECHANIC for the /mechanics view). */
  findAllByRole(role: Role): Promise<UserRecord[]>;
  create(data: CreateUserData): Promise<UserRecord>;
  update(id: string, data: UpdateUserData): Promise<UserRecord>;
}
