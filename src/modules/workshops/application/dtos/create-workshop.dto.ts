import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** New workshops always start active; status is not client-controlled. */
export class CreateWorkshopDto {
  @ApiProperty({ example: 'Central Workshop', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name: string;

  @ApiProperty({ example: 'Calle 10 # 5-20, Bogota', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly address: string;
}
