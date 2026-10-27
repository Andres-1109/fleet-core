import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../../../domain-contracts';
import {
  ApiErrors,
  ApiSuccess,
} from '../../../../shared/swagger/api-responses.decorator';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { CreateVehicleDto } from '../../application/dtos/create-vehicle.dto';
import { UpdateVehicleDto } from '../../application/dtos/update-vehicle.dto';
import { VehicleResponseDto } from '../../application/dtos/vehicle-response.dto';
import { CreateVehicleUseCase } from '../../application/use-cases/create-vehicle.use-case';
import { DeactivateVehicleUseCase } from '../../application/use-cases/deactivate-vehicle.use-case';
import { FindAllVehiclesUseCase } from '../../application/use-cases/find-all-vehicles.use-case';
import { FindVehicleUseCase } from '../../application/use-cases/find-vehicle.use-case';
import { UpdateVehicleUseCase } from '../../application/use-cases/update-vehicle.use-case';
import { Vehicle } from '../../domain/vehicle.entity';

const UNAUTHORIZED = 'Missing, invalid, or expired token.';
const ADMIN_ONLY = 'Only ADMIN users can modify vehicles.';

// Reads are open to both roles; writes override this with @Roles(Role.ADMIN).
@ApiTags('Vehicles')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.MECHANIC)
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly createVehicle: CreateVehicleUseCase,
    private readonly findAllVehicles: FindAllVehiclesUseCase,
    private readonly findVehicle: FindVehicleUseCase,
    private readonly updateVehicle: UpdateVehicleUseCase,
    private readonly deactivateVehicle: DeactivateVehicleUseCase,
  ) {}

  @ApiOperation({
    summary: 'List vehicles',
    description:
      'Returns all vehicles, including inactive ones, ordered by plate. Roles: ADMIN, MECHANIC.',
  })
  @ApiSuccess(VehicleResponseDto, {
    isArray: true,
    description: 'List of vehicles.',
  })
  @ApiErrors({ unauthorized: UNAUTHORIZED })
  @Get()
  findAll(): Promise<Vehicle[]> {
    return this.findAllVehicles.execute();
  }

  @ApiOperation({
    summary: 'Get a vehicle by id or plate',
    description:
      'The identifier is resolved as a UUID first, otherwise as a license plate (case-insensitive). Roles: ADMIN, MECHANIC.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Vehicle UUID or license plate.',
    example: 'ABC123',
  })
  @ApiSuccess(VehicleResponseDto, { description: 'The vehicle.' })
  @ApiErrors({
    unauthorized: UNAUTHORIZED,
    notFound: 'No vehicle with that id or plate.',
  })
  @Get(':identifier')
  findOne(@Param('identifier') identifier: string): Promise<Vehicle> {
    return this.findVehicle.execute(identifier);
  }

  @ApiOperation({
    summary: 'Create a vehicle',
    description:
      'Creates a vehicle with status AVAILABLE. The plate is normalized to upper case. Roles: ADMIN.',
  })
  @ApiSuccess(VehicleResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Vehicle created.',
  })
  @ApiErrors({
    badRequest: 'Invalid payload (status cannot be sent on creation).',
    unauthorized: UNAUTHORIZED,
    forbidden: ADMIN_ONLY,
    conflict: 'A vehicle with that plate already exists.',
  })
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateVehicleDto): Promise<Vehicle> {
    return this.createVehicle.execute(dto);
  }

  @ApiOperation({
    summary: 'Update a vehicle',
    description:
      'Partially updates a vehicle. An INACTIVE vehicle can only be reactivated (status AVAILABLE); a vehicle IN_MAINTENANCE cannot have its status changed manually. Roles: ADMIN.',
  })
  @ApiSuccess(VehicleResponseDto, { description: 'The updated vehicle.' })
  @ApiErrors({
    badRequest:
      'Invalid payload or id (status IN_MAINTENANCE cannot be set manually).',
    unauthorized: UNAUTHORIZED,
    forbidden: ADMIN_ONLY,
    notFound: 'No vehicle with that id.',
    conflict:
      'Plate already in use, vehicle inactive, or vehicle in maintenance.',
  })
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    return this.updateVehicle.execute(id, dto);
  }

  @ApiOperation({
    summary: 'Deactivate a vehicle',
    description:
      'Logical deletion: sets the status to INACTIVE and keeps the row and its maintenance history. Deactivating an already inactive vehicle is a no-op. Roles: ADMIN.',
  })
  @ApiSuccess(VehicleResponseDto, { description: 'The vehicle, now INACTIVE.' })
  @ApiErrors({
    badRequest: 'The id is not a valid UUID.',
    unauthorized: UNAUTHORIZED,
    forbidden: ADMIN_ONLY,
    notFound: 'No vehicle with that id.',
    conflict: 'The vehicle is in maintenance.',
  })
  @Roles(Role.ADMIN)
  @Delete(':id')
  deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<Vehicle> {
    return this.deactivateVehicle.execute(id);
  }
}
