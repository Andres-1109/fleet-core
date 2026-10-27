import { ApiProperty } from '@nestjs/swagger';
import { UserRecord } from '../../../../domain-contracts';

/** Public view of a mechanic. Never includes the password hash. */
export class MechanicProfile {
  @ApiProperty({
    format: 'uuid',
    example: '3f2b8c1e-5a4d-4e7a-9c1b-2d8e6f0a1b2c',
  })
  id: string;

  @ApiProperty({ example: 'Laura Mechanic' })
  name: string;

  @ApiProperty({ example: 'laura@fleetcore.com' })
  email: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Brakes and suspension',
  })
  specialty: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export function toMechanicProfile(user: UserRecord): MechanicProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    specialty: user.specialty,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
