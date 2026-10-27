import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { normalizeEmail } from '../../../../shared/transformers/normalize-email.transformer';

/** Partial update. Role, password and status cannot be changed through it. */
export class UpdateMechanicDto {
  @ApiPropertyOptional({ example: 'Laura R. Mechanic', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name?: string;

  @ApiPropertyOptional({ example: 'laura.r@fleetcore.com' })
  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(255)
  readonly email?: string;

  @ApiPropertyOptional({ example: 'Transmissions', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly specialty?: string;
}
