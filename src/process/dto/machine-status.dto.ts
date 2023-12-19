import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class MachineStatusDto {

  @ApiProperty()
  @IsBoolean()
  process_status: boolean;
};