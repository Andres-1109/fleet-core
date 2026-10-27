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
import { CreateWorkshopDto } from '../../application/dtos/create-workshop.dto';
import { ListWorkshopsQueryDto } from '../../application/dtos/list-workshops-query.dto';
import { UpdateWorkshopDto } from '../../application/dtos/update-workshop.dto';
import { WorkshopResponseDto } from '../../application/dtos/workshop-response.dto';
import { CreateWorkshopUseCase } from '../../application/use-cases/create-workshop.use-case';
import { FindAllWorkshopsUseCase } from '../../application/use-cases/find-all-workshops.use-case';
import { FindOneWorkshopUseCase } from '../../application/use-cases/find-one-workshop.use-case';
import { ToggleWorkshopStatusUseCase } from '../../application/use-cases/toggle-workshop-status.use-case';
import { UpdateWorkshopUseCase } from '../../application/use-cases/update-workshop.use-case';
import { Workshop } from '../../domain/workshop.entity';

const UNAUTHORIZED = 'Missing, invalid, or expired token.';
const ADMIN_ONLY = 'Only ADMIN users can modify workshops.';
const BAD_ID = 'The id is not a valid UUID.';
const NOT_FOUND = 'No workshop with that id.';

// Reads are open to both roles; writes override this with @Roles(Role.ADMIN).
@ApiTags('Workshops')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.MECHANIC)
@Controller('workshops')
export class WorkshopsController {
  constructor(
    private readonly createWorkshop: CreateWorkshopUseCase,
    private readonly findAllWorkshops: FindAllWorkshopsUseCase,
    private readonly findOneWorkshop: FindOneWorkshopUseCase,
    private readonly updateWorkshop: UpdateWorkshopUseCase,
    private readonly toggleWorkshopStatus: ToggleWorkshopStatusUseCase,
  ) {}

  @ApiOperation({
    summary: 'List active workshops',
    description:
      'Returns active workshops ordered by name. Admins can add `includeInactive=true` to also see inactive ones; for mechanics the flag is ignored. Roles: ADMIN, MECHANIC.',
  })
  @ApiSuccess(WorkshopResponseDto, {
    isArray: true,
    description: 'List of workshops.',
  })
  @ApiErrors({
    badRequest: 'includeInactive is not a boolean.',
    unauthorized: UNAUTHORIZED,
  })
  @Get()
  findAll(
    @Query() query: ListWorkshopsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Workshop[]> {
    return this.findAllWorkshops.execute(query, user.role);
  }

  @ApiOperation({
    summary: 'Get a workshop',
    description:
      'Fetches one workshop by id, whether active or not. Roles: ADMIN, MECHANIC.',
  })
  @ApiSuccess(WorkshopResponseDto, { description: 'The workshop.' })
  @ApiErrors({
    badRequest: BAD_ID,
    unauthorized: UNAUTHORIZED,
    notFound: NOT_FOUND,
  })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Workshop> {
    return this.findOneWorkshop.execute(id);
  }

  @ApiOperation({
    summary: 'Create a workshop',
    description: 'Creates an active workshop. Roles: ADMIN.',
  })
  @ApiSuccess(WorkshopResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Workshop created.',
  })
  @ApiErrors({
    badRequest: 'Invalid payload.',
    unauthorized: UNAUTHORIZED,
    forbidden: ADMIN_ONLY,
  })
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateWorkshopDto): Promise<Workshop> {
    return this.createWorkshop.execute(dto);
  }

  @ApiOperation({
    summary: 'Update a workshop',
    description:
      'Partially updates name or address. Activation is changed through the status endpoint. Roles: ADMIN.',
  })
  @ApiSuccess(WorkshopResponseDto, { description: 'The updated workshop.' })
  @ApiErrors({
    badRequest: 'Invalid payload or id.',
    unauthorized: UNAUTHORIZED,
    forbidden: ADMIN_ONLY,
    notFound: NOT_FOUND,
  })
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkshopDto,
  ): Promise<Workshop> {
    return this.updateWorkshop.execute(id, dto);
  }

  @ApiOperation({
    summary: 'Toggle workshop status',
    description:
      'Flips the workshop between active and inactive. Inactive workshops cannot be assigned to new maintenances. Roles: ADMIN.',
  })
  @ApiSuccess(WorkshopResponseDto, {
    description: 'The workshop with its new status.',
  })
  @ApiErrors({
    badRequest: BAD_ID,
    unauthorized: UNAUTHORIZED,
    forbidden: ADMIN_ONLY,
    notFound: NOT_FOUND,
  })
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  toggleStatus(@Param('id', ParseUUIDPipe) id: string): Promise<Workshop> {
    return this.toggleWorkshopStatus.execute(id);
  }
}
