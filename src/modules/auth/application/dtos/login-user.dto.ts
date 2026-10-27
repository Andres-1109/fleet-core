import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { normalizeEmail } from '../../../../shared/transformers/normalize-email.transformer';

export class LoginUserDto {
  @ApiProperty({ example: 'admin@fleetcore.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @IsNotEmpty()
  readonly password: string;
}
