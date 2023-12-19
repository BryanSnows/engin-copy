import { ApiProperty } from '@nestjs/swagger';

export class CreateMachineModelDto {
  @ApiProperty()
  machine_model_name: string;

  @ApiProperty({ example: '000.000.00.000' })
  machine_model_ip: string;
}
