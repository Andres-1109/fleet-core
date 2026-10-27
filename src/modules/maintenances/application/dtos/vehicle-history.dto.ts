import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '../../../../domain-contracts';
import { Maintenance } from '../../domain/maintenance.entity';
import { MaintenanceResponseDto } from './maintenance-response.dto';

/** Vehicle details embedded in the history response. */
export class VehicleSnapshotDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ABC123' })
  plate: string;

  @ApiProperty({ example: 'Toyota' })
  brand: string;

  @ApiProperty({ example: 'Hilux' })
  model: string;

  @ApiProperty({ example: 2021 })
  year: number;

  @ApiProperty({ example: 45600 })
  mileage: number;

  @ApiProperty({ enum: VehicleStatus, enumName: 'VehicleStatus' })
  status: VehicleStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

/** Vehicle details plus every maintenance it ever had, newest first. */
export class VehicleHistory {
  @ApiProperty({ type: VehicleSnapshotDto })
  vehicle: VehicleSnapshotDto;

  @ApiProperty({ type: [MaintenanceResponseDto] })
  maintenances: Maintenance[];
}
