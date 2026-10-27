import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { MaintenanceType } from '../../../../domain-contracts';

export class CreateMaintenanceDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Must be an existing, non-INACTIVE vehicle with no active maintenance.',
  })
  @IsUUID()
  readonly vehicleId: string;

  @ApiProperty({
    format: 'uuid',
    description:
      'Must be an active MECHANIC without an overlapping active maintenance.',
  })
  @IsUUID()
  readonly mechanicId: string;

  @ApiProperty({ format: 'uuid', description: 'Must be an active workshop.' })
  @IsUUID()
  readonly workshopId: string;

  @ApiProperty({ enum: MaintenanceType, enumName: 'MaintenanceType' })
  @IsEnum(MaintenanceType)
  readonly type: MaintenanceType;

  @ApiProperty({ example: 'Oil and filter change', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  readonly description: string;

  @ApiProperty({
    example: 45300,
    minimum: 0,
    description:
      "Odometer reading when the vehicle enters maintenance; cannot be lower than the vehicle's current mileage.",
  })
  @IsInt()
  @Min(0)
  readonly mileage: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-10T10:00:00Z',
    description: 'Inclusive start of the reserved window (ISO 8601).',
  })
  @Type(() => Date)
  @IsDate()
  readonly scheduledStartDate: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-10T12:00:00Z',
    description:
      'Exclusive end of the reserved window (ISO 8601); must be later than the start. Back-to-back windows do not overlap.',
  })
  @Type(() => Date)
  @IsDate()
  readonly scheduledEndDate: Date;
}
