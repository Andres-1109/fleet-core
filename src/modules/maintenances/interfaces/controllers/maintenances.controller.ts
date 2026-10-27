import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../../domain-contracts';
import type { AuthenticatedUser } from '../../../../domain-contracts';
import {
  ApiErrors,
  ApiSuccess,
} from '../../../../shared/swagger/api-responses.decorator';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { CreateMaintenanceDto } from '../../application/dtos/create-maintenance.dto';
import { MaintenanceResponseDto } from '../../application/dtos/maintenance-response.dto';
import { ListMaintenancesQueryDto } from '../../application/dtos/list-maintenances-query.dto';
import { UpdateMaintenanceStatusDto } from '../../application/dtos/update-maintenance-status.dto';
import { CreateMaintenanceUseCase } from '../../application/use-cases/create-maintenance.use-case';
import { FindActiveMaintenancesUseCase } from '../../application/use-cases/find-active-maintenances.use-case';
import { FindAllMaintenancesUseCase } from '../../application/use-cases/find-all-maintenances.use-case';
import { FindMaintenancesByMechanicUseCase } from '../../application/use-cases/find-maintenances-by-mechanic.use-case';
import { FindMaintenancesByVehicleUseCase } from '../../application/use-cases/find-maintenances-by-vehicle.use-case';
import { UpdateMaintenanceStatusUseCase } from '../../application/use-cases/update-maintenance-status.use-case';
import { Maintenance } from '../../domain/maintenance.entity';

const UNAUTHORIZED = 'Missing, invalid, or expired token.';
const ADMIN_ONLY = 'Only ADMIN users can use this endpoint.';
const BAD_ID = 'A path parameter is not a valid UUID.';

@ApiTags('Maintenances')
@ApiBearerAuth()
@Controller('maintenances')
export class MaintenancesController {
  constructor(
    private readonly createMaintenance: CreateMaintenanceUseCase,
    private readonly updateMaintenanceStatus: UpdateMaintenanceStatusUseCase,
    private readonly findAllMaintenances: FindAllMaintenancesUseCase,
    private readonly findActiveMaintenances: FindActiveMaintenancesUseCase,
    private readonly findMaintenancesByVehicle: FindMaintenancesByVehicleUseCase,
    private readonly findMaintenancesByMechanic: FindMaintenancesByMechanicUseCase,
  ) {}

  @ApiOperation({
    summary: 'Schedule a maintenance',
    description:
      "Creates a SCHEDULED maintenance after validating: the vehicle is not INACTIVE and has no other active maintenance; the mechanic and workshop are active; the mileage is not below the vehicle's current mileage; and the mechanic has no active maintenance overlapping [start, end). Back-to-back windows are allowed. Roles: ADMIN.",
  })
  @ApiSuccess(MaintenanceResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Maintenance scheduled.',
  })
  @ApiErrors({
    badRequest: 'Invalid payload, or the end date is not after the start date.',
    unauthorized: UNAUTHORIZED,
    forbidden: ADMIN_ONLY,
    notFound: 'The vehicle, mechanic, or workshop does not exist.',
    conflict:
      "Inactive vehicle/mechanic/workshop, vehicle already has an active maintenance, mechanic schedule overlap, or mileage below the vehicle's.",
  })
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateMaintenanceDto): Promise<Maintenance> {
    return this.createMaintenance.execute(dto);
  }

  @ApiOperation({
    summary: 'List maintenances',
    description:
      'Returns all maintenances, newest first, optionally filtered (filters combine with AND). Roles: ADMIN.',
  })
  @ApiSuccess(MaintenanceResponseDto, {
    isArray: true,
    description: 'List of maintenances.',
  })
  @ApiErrors({
    badRequest: 'A filter value is invalid.',
    unauthorized: UNAUTHORIZED,
    forbidden: ADMIN_ONLY,
  })
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: ListMaintenancesQueryDto): Promise<Maintenance[]> {
    return this.findAllMaintenances.execute(query);
  }

  @ApiOperation({
    summary: 'List active maintenances',
    description:
      'Returns SCHEDULED and IN_PROGRESS maintenances, soonest first. Mechanics see all active maintenances here; only the by-mechanic endpoint is restricted to their own. Roles: ADMIN, MECHANIC.',
  })
  @ApiSuccess(MaintenanceResponseDto, {
    isArray: true,
    description: 'Active maintenances.',
  })
  @ApiErrors({ unauthorized: UNAUTHORIZED, forbidden: 'Role not allowed.' })
  @Roles(Role.ADMIN, Role.MECHANIC)
  @Get('active')
  findActive(): Promise<Maintenance[]> {
    return this.findActiveMaintenances.execute();
  }

  @ApiOperation({
    summary: 'List maintenances of a vehicle',
    description:
      'Full maintenance history of one vehicle, newest first. Roles: ADMIN.',
  })
  @ApiSuccess(MaintenanceResponseDto, {
    isArray: true,
    description: 'Maintenances of the vehicle.',
  })
  @ApiErrors({
    badRequest: BAD_ID,
    unauthorized: UNAUTHORIZED,
    forbidden: ADMIN_ONLY,
    notFound: 'No vehicle with that id.',
  })
  @Roles(Role.ADMIN)
  @Get('vehicle/:vehicleId')
  findByVehicle(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
  ): Promise<Maintenance[]> {
    return this.findMaintenancesByVehicle.execute(vehicleId);
  }

  @ApiOperation({
    summary: 'List maintenances of a mechanic',
    description:
      'Maintenances assigned to one mechanic, newest first. Admins can query any mechanic; a mechanic can only query their own id. Roles: ADMIN, MECHANIC (own).',
  })
  @ApiSuccess(MaintenanceResponseDto, {
    isArray: true,
    description: 'Maintenances of the mechanic.',
  })
  @ApiErrors({
    badRequest: BAD_ID,
    unauthorized: UNAUTHORIZED,
    forbidden: "A mechanic asked for another mechanic's maintenances.",
    notFound: 'No mechanic with that id.',
  })
  @Roles(Role.ADMIN, Role.MECHANIC)
  @Get('mechanic/:mechanicId')
  findByMechanic(
    @Param('mechanicId', ParseUUIDPipe) mechanicId: string,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<Maintenance[]> {
    return this.findMaintenancesByMechanic.execute(mechanicId, requester);
  }

  @ApiOperation({
    summary: 'Change a maintenance status',
    description:
      'Applies a state transition. SCHEDULED → IN_PROGRESS | CANCELLED; IN_PROGRESS → COMPLETED | CANCELLED; COMPLETED and CANCELLED are terminal. Starting sets the vehicle IN_MAINTENANCE; completing (which requires workPerformed, finalCost, finalMileage and finishedAt) or cancelling an in-progress maintenance sets it back to AVAILABLE. The maintenance and the vehicle change in one transaction. Roles: ADMIN, MECHANIC (only maintenances assigned to them).',
  })
  @ApiSuccess(MaintenanceResponseDto, {
    description: 'The maintenance with its new status.',
  })
  @ApiErrors({
    badRequest:
      'Invalid payload, missing closing fields for COMPLETED, or closing fields sent for another status.',
    unauthorized: UNAUTHORIZED,
    forbidden:
      'A mechanic tried to change a maintenance assigned to someone else.',
    notFound: 'No maintenance with that id.',
    conflict:
      'Invalid transition, finalMileage below the maintenance mileage, inactive vehicle, or the maintenance was changed concurrently.',
  })
  @Roles(Role.ADMIN, Role.MECHANIC)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<Maintenance> {
    return this.updateMaintenanceStatus.execute(id, dto, requester);
  }
}
