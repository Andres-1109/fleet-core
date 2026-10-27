import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import {
  MaintenanceStatus,
  MaintenanceType,
} from '../../../../domain-contracts';

/** Optional filters for GET /maintenances; all of them are combined with AND. */
export class ListMaintenancesQueryDto {
  @ApiPropertyOptional({
    enum: MaintenanceStatus,
    enumName: 'MaintenanceStatus',
  })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  readonly status?: MaintenanceStatus;

  @ApiPropertyOptional({ enum: MaintenanceType, enumName: 'MaintenanceType' })
  @IsOptional()
  @IsEnum(MaintenanceType)
  readonly type?: MaintenanceType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  readonly vehicleId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  readonly mechanicId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  readonly workshopId?: string;
}
