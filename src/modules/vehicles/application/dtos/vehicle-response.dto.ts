import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '../../../../domain-contracts';

/** Documentation-only shape of a vehicle in API responses. */
export class VehicleResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '3f2b8c1e-5a4d-4e7a-9c1b-2d8e6f0a1b2c',
  })
  id: string;

  @ApiProperty({ example: 'ABC123' })
  plate: string;

  @ApiProperty({ example: 'Toyota' })
  brand: string;

  @ApiProperty({ example: 'Hilux' })
  model: string;

  @ApiProperty({ example: 2021 })
  year: number;

  @ApiProperty({ example: 45300 })
  mileage: number;

  @ApiProperty({ enum: VehicleStatus, enumName: 'VehicleStatus' })
  status: VehicleStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
