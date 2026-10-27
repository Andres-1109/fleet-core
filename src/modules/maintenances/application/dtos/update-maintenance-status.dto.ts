import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MaintenanceStatus } from '../../../../domain-contracts';

/**
 * Target status plus closing details. The closing fields are required when the
 * target is COMPLETED and rejected for any other target.
 */
export class UpdateMaintenanceStatusDto {
  @ApiProperty({
    enum: MaintenanceStatus,
    enumName: 'MaintenanceStatus',
    description:
      'Target status. Allowed: SCHEDULED → IN_PROGRESS | CANCELLED, IN_PROGRESS → COMPLETED | CANCELLED. COMPLETED and CANCELLED are terminal.',
  })
  @IsEnum(MaintenanceStatus)
  readonly status: MaintenanceStatus;

  @ApiPropertyOptional({
    example: 'Oil and filter change, brake inspection',
    maxLength: 2000,
    description: 'Required when status is COMPLETED; rejected otherwise.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  readonly workPerformed?: string;

  @ApiPropertyOptional({
    example: 185.5,
    minimum: 0,
    description:
      'Up to 2 decimals. Required when status is COMPLETED; rejected otherwise.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  readonly finalCost?: number;

  @ApiPropertyOptional({
    example: 45600,
    minimum: 0,
    description:
      'Required when status is COMPLETED; cannot be lower than the maintenance mileage. Also becomes the vehicle mileage if higher.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly finalMileage?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-11-10T11:45:00Z',
    description: 'Required when status is COMPLETED; rejected otherwise.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly finishedAt?: Date;
}
