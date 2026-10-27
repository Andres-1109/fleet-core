import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../../domain-contracts';
import { User } from '../../domain/user.entity';

/** Public view of a user. Never includes the password hash. */
export class UserProfile {
  @ApiProperty({
    format: 'uuid',
    example: '3f2b8c1e-5a4d-4e7a-9c1b-2d8e6f0a1b2c',
  })
  id: string;

  @ApiProperty({ example: 'Carlos Mechanic' })
  name: string;

  @ApiProperty({ example: 'carlos@fleetcore.com' })
  email: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  role: Role;

  @ApiProperty({ type: String, nullable: true, example: 'Engines' })
  specialty: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    specialty: user.specialty,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
