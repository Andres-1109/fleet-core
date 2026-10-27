import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Vehicle } from '../../domain/vehicle.entity';

export const PLATE_PATTERN = /^[A-Z0-9-]{3,15}$/;
// Allow next year's models, which dealers register before the year starts.
export const MAX_VEHICLE_YEAR = new Date().getFullYear() + 1;
export const MIN_VEHICLE_YEAR = 1900;

export const normalizePlate = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? Vehicle.normalizePlate(value) : value;

/** New vehicles always start as AVAILABLE; status is not client-controlled. */
export class CreateVehicleDto {
  @ApiProperty({
    example: 'ABC123',
    description:
      'License plate: 3-15 letters, digits or hyphens. Stored trimmed and upper-cased; must be unique.',
  })
  @Transform(normalizePlate)
  @Matches(PLATE_PATTERN, {
    message: 'plate must be 3-15 characters: letters, digits, or hyphens',
  })
  readonly plate: string;

  @ApiProperty({ example: 'Toyota', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly brand: string;

  @ApiProperty({ example: 'Hilux', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly model: string;

  @ApiProperty({
    example: 2021,
    minimum: MIN_VEHICLE_YEAR,
    maximum: MAX_VEHICLE_YEAR,
  })
  @IsInt()
  @Min(MIN_VEHICLE_YEAR)
  @Max(MAX_VEHICLE_YEAR)
  readonly year: number;

  @ApiProperty({ example: 45300, minimum: 0, description: 'Odometer reading.' })
  @IsInt()
  @Min(0)
  readonly mileage: number;
}
