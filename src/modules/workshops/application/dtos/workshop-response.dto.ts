import { ApiProperty } from '@nestjs/swagger';

/** Documentation-only shape of a workshop in API responses. */
export class WorkshopResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '3f2b8c1e-5a4d-4e7a-9c1b-2d8e6f0a1b2c',
  })
  id: string;

  @ApiProperty({ example: 'Central Workshop' })
  name: string;

  @ApiProperty({ example: 'Calle 10 # 5-20, Bogota' })
  address: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
