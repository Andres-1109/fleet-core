import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../../domain-contracts';
import {
  ApiErrors,
  ApiSuccess,
} from '../../../../shared/swagger/api-responses.decorator';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { CreateMechanicDto } from '../../application/dtos/create-mechanic.dto';
import { MechanicProfile } from '../../application/dtos/mechanic-profile.dto';
import { UpdateMechanicDto } from '../../application/dtos/update-mechanic.dto';
import { CreateMechanicUseCase } from '../../application/use-cases/create-mechanic.use-case';
import { FindAllMechanicsUseCase } from '../../application/use-cases/find-all-mechanics.use-case';
import { FindOneMechanicUseCase } from '../../application/use-cases/find-one-mechanic.use-case';
import { ToggleMechanicStatusUseCase } from '../../application/use-cases/toggle-mechanic-status.use-case';
import { UpdateMechanicUseCase } from '../../application/use-cases/update-mechanic.use-case';

@ApiTags('Mechanics')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('mechanics')
export class MechanicsController {
  constructor(
    private readonly createMechanic: CreateMechanicUseCase,
    private readonly findAllMechanics: FindAllMechanicsUseCase,
    private readonly findOneMechanic: FindOneMechanicUseCase,
    private readonly updateMechanic: UpdateMechanicUseCase,
    private readonly toggleMechanicStatus: ToggleMechanicStatusUseCase,
  ) {}

  @ApiOperation({
    summary: 'List mechanics',
    description:
      'Returns every user with role MECHANIC, active or not, ordered by name. Roles: ADMIN.',
  })
  @ApiSuccess(MechanicProfile, {
    isArray: true,
    description: 'List of mechanics.',
  })
  @ApiErrors({
    unauthorized: 'Missing, invalid, or expired token.',
    forbidden: 'Only ADMIN users can manage mechanics.',
  })
  @Get()
  findAll(): Promise<MechanicProfile[]> {
    return this.findAllMechanics.execute();
  }

  @ApiOperation({
    summary: 'Get a mechanic',
    description:
      'Fetches one mechanic by id. Users with another role are reported as not found. Roles: ADMIN.',
  })
  @ApiSuccess(MechanicProfile, { description: 'The mechanic.' })
  @ApiErrors({
    unauthorized: 'Missing, invalid, or expired token.',
    forbidden: 'Only ADMIN users can manage mechanics.',
    badRequest: 'The id is not a valid UUID.',
    notFound: 'No mechanic with that id.',
  })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<MechanicProfile> {
    return this.findOneMechanic.execute(id);
  }

  @ApiOperation({
    summary: 'Create a mechanic',
    description:
      'Creates an active user with role MECHANIC and the given initial password. Roles: ADMIN.',
  })
  @ApiSuccess(MechanicProfile, {
    status: HttpStatus.CREATED,
    description: 'Mechanic created.',
  })
  @ApiErrors({
    unauthorized: 'Missing, invalid, or expired token.',
    forbidden: 'Only ADMIN users can manage mechanics.',
    badRequest: 'Invalid payload.',
    conflict: 'The email is already in use.',
  })
  @Post()
  create(@Body() dto: CreateMechanicDto): Promise<MechanicProfile> {
    return this.createMechanic.execute(dto);
  }

  @ApiOperation({
    summary: 'Update a mechanic',
    description:
      'Partially updates name, email, or specialty. An empty body changes nothing. Roles: ADMIN.',
  })
  @ApiSuccess(MechanicProfile, { description: 'The updated mechanic.' })
  @ApiErrors({
    unauthorized: 'Missing, invalid, or expired token.',
    forbidden: 'Only ADMIN users can manage mechanics.',
    badRequest:
      'Invalid payload or id; role, password and status cannot be sent.',
    notFound: 'No mechanic with that id.',
    conflict: 'The new email is already in use.',
  })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMechanicDto,
  ): Promise<MechanicProfile> {
    return this.updateMechanic.execute(id, dto);
  }

  @ApiOperation({
    summary: 'Toggle mechanic status',
    description:
      'Flips the mechanic between active and inactive. Inactive mechanics cannot log in or be assigned to new maintenances. Roles: ADMIN.',
  })
  @ApiSuccess(MechanicProfile, {
    description: 'The mechanic with its new status.',
  })
  @ApiErrors({
    unauthorized: 'Missing, invalid, or expired token.',
    forbidden: 'Only ADMIN users can manage mechanics.',
    badRequest: 'The id is not a valid UUID.',
    notFound: 'No mechanic with that id.',
  })
  @Patch(':id/status')
  toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MechanicProfile> {
    return this.toggleMechanicStatus.execute(id);
  }
}
