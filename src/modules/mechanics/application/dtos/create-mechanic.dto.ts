import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { normalizeEmail } from '../../../../shared/transformers/normalize-email.transformer';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Laura Mechanic', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name: string;

  @ApiProperty({
    example: 'laura@fleetcore.com',
    description: 'Stored trimmed and lowercased; must be unique.',
  })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(255)
  readonly email: string;

  @ApiProperty({
    example: 'Mechanic123!',
    minLength: 8,
    maxLength: 72,
    description: 'Initial password chosen by the admin.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  readonly password: string;

  @ApiProperty({ example: 'Brakes and suspension', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly specialty: string;
}
