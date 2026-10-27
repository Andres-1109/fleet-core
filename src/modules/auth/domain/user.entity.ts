import { Role, UserRecord } from '../../../domain-contracts';

/** Domain representation of a user. Pure TypeScript, no persistence concerns. */
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly role: Role,
    public readonly specialty: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromRecord(record: UserRecord): User {
    return new User(
      record.id,
      record.name,
      record.email,
      record.password,
      record.role,
      record.specialty,
      record.isActive,
      record.createdAt,
      record.updatedAt,
    );
  }

  isMechanic(): boolean {
    return this.role === Role.MECHANIC;
  }

  /** Deactivated users must not be able to log in or use an existing token. */
  canAuthenticate(): boolean {
    return this.isActive;
  }
}
