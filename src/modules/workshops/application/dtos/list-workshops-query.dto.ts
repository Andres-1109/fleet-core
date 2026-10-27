import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListWorkshopsQueryDto {
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description:
      'Include inactive workshops. Only honored for ADMIN users; everyone else always gets active workshops.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  readonly includeInactive?: boolean;
}
