import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  ApiErrors,
  ApiSuccess,
} from '../../../../shared/swagger/api-responses.decorator';
import { Public } from '../../../../shared/decorators/public.decorator';
import { ApiKeyGuard } from '../../../../shared/guards/api-key.guard';
import { VehicleHistory } from '../../application/dtos/vehicle-history.dto';
import { FindVehicleHistoryUseCase } from '../../application/use-cases/find-vehicle-history.use-case';

/**
 * External integrations endpoint. @Public() skips the global JWT guard and
 * ApiKeyGuard requires a valid `x-api-key` header instead.
 */
@ApiTags('External')
@ApiSecurity('x-api-key')
@Public()
@UseGuards(ApiKeyGuard)
@Controller('external/vehicles')
export class VehicleHistoryController {
  constructor(private readonly findVehicleHistory: FindVehicleHistoryUseCase) {}

  @ApiOperation({
    summary: 'Vehicle maintenance history by plate',
    description:
      'For external integrations. Authenticated with the `x-api-key` header (values come from the API_KEYS environment variable); JWT is not used. Returns the vehicle and all of its maintenances, newest first.',
  })
  @ApiParam({
    name: 'plate',
    description: 'License plate (case-insensitive).',
    example: 'ABC123',
  })
  @ApiSuccess(VehicleHistory, {
    description: 'Vehicle details and maintenance history.',
  })
  @ApiErrors({
    unauthorized: 'Missing or invalid x-api-key header.',
    notFound: 'No vehicle with that plate.',
  })
  @Get(':plate/history')
  getHistory(@Param('plate') plate: string): Promise<VehicleHistory> {
    return this.findVehicleHistory.execute(plate);
  }
}
