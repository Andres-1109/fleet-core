import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../../../domain-contracts';
import { normalizeEmail } from '../../../../shared/transformers/normalize-email.transformer';

export class RegisterUserDto {
  @ApiProperty({ example: 'Carlos Mechanic', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name: string;

  @ApiProperty({
    example: 'carlos@fleetcore.com',
    description: 'Stored trimmed and lowercased; must be unique.',
  })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(255)
  readonly email: string;

  // bcrypt silently ignores bytes beyond 72, so cap the length.
  @ApiProperty({ example: 'Secret123!', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  readonly password: string;

  @ApiProperty({ enum: Role, enumName: 'Role', example: Role.MECHANIC })
  @IsEnum(Role)
  readonly role: Role;

  @ApiPropertyOptional({
    example: 'Engines',
    maxLength: 100,
    description: 'Required when role is MECHANIC; ignored for ADMIN.',
  })
  @ValidateIf((dto: RegisterUserDto) => dto.role === Role.MECHANIC)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly specialty?: string;
}
