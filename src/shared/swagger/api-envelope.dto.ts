import { ApiProperty } from '@nestjs/swagger';

/**
 * Documentation-only description of the envelope applied by
 * ResponseInterceptor. The `data` field is documented per endpoint.
 */
export class SuccessEnvelopeDto {
  @ApiProperty({ example: true })
  success: true;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp: string;
}

/** Documentation-only description of the envelope applied by HttpExceptionFilter. */
export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: false;

  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({
    example: 'Vehicle ABC123 already has an active maintenance',
    description:
      'Human-readable explanation; validation errors are joined with "; ".',
  })
  message: string;

  @ApiProperty({ example: '/maintenances' })
  path: string;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp: string;
}
