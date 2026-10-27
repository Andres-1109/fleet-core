import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Partial update. Activation is handled by the dedicated status endpoint. */
export class UpdateWorkshopDto {
  @ApiPropertyOptional({ example: 'Central Workshop', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name?: string;

  @ApiPropertyOptional({ example: 'Calle 12 # 6-30, Bogota', maxLength: 255 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly address?: string;
}
