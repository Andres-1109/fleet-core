import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleStatus } from '../../../../domain-contracts';
import {
  MAX_VEHICLE_YEAR,
  MIN_VEHICLE_YEAR,
  normalizePlate,
  PLATE_PATTERN,
} from './create-vehicle.dto';

/** Statuses an admin may set by hand. IN_MAINTENANCE is driven by maintenances. */
export const MANUAL_VEHICLE_STATUSES = [
  VehicleStatus.AVAILABLE,
  VehicleStatus.INACTIVE,
] as const;

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'ABC124', description: 'Must stay unique.' })
  @IsOptional()
  @Transform(normalizePlate)
  @Matches(PLATE_PATTERN, {
    message: 'plate must be 3-15 characters: letters, digits, or hyphens',
  })
  readonly plate?: string;

  @ApiPropertyOptional({ example: 'Toyota', maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly brand?: string;

  @ApiPropertyOptional({ example: 'Hilux', maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly model?: string;

  @ApiPropertyOptional({
    example: 2021,
    minimum: MIN_VEHICLE_YEAR,
    maximum: MAX_VEHICLE_YEAR,
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_VEHICLE_YEAR)
  @Max(MAX_VEHICLE_YEAR)
  readonly year?: number;

  @ApiPropertyOptional({ example: 46000, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly mileage?: number;

  @ApiPropertyOptional({
    enum: [...MANUAL_VEHICLE_STATUSES],
    enumName: 'ManualVehicleStatus',
    description:
      'Only AVAILABLE or INACTIVE can be set by hand; IN_MAINTENANCE follows the maintenance lifecycle. An INACTIVE vehicle can only be reactivated with AVAILABLE.',
  })
  @IsOptional()
  @IsIn(MANUAL_VEHICLE_STATUSES)
  readonly status?: VehicleStatus.AVAILABLE | VehicleStatus.INACTIVE;
}
