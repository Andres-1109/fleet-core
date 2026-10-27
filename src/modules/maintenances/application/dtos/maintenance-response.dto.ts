import { ApiProperty } from '@nestjs/swagger';
import {
  MaintenanceStatus,
  MaintenanceType,
} from '../../../../domain-contracts';

/** Documentation-only shape of a maintenance in API responses. */
export class MaintenanceResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '3f2b8c1e-5a4d-4e7a-9c1b-2d8e6f0a1b2c',
  })
  id: string;

  @ApiProperty({ enum: MaintenanceType, enumName: 'MaintenanceType' })
  type: MaintenanceType;

  @ApiProperty({ example: 'Oil and filter change' })
  description: string;

  @ApiProperty({ example: 45300 })
  mileage: number;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledStartDate: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledEndDate: Date;

  @ApiProperty({ enum: MaintenanceStatus, enumName: 'MaintenanceStatus' })
  status: MaintenanceStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Set when COMPLETED.',
  })
  workPerformed: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 185.5,
    description: 'Set when COMPLETED.',
  })
  finalCost: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 45600,
    description: 'Set when COMPLETED.',
  })
  finalMileage: number | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Set when COMPLETED.',
  })
  finishedAt: Date | null;

  @ApiProperty({ format: 'uuid' })
  vehicleId: string;

  @ApiProperty({ format: 'uuid' })
  mechanicId: string;

  @ApiProperty({ format: 'uuid' })
  workshopId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
