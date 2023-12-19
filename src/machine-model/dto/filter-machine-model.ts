import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptionsDto } from 'src/common/pagination/pagination.dto';

export class MachineModelFilter extends PaginationOptionsDto {
  @ApiProperty({ required: false })
  search: string;

  @ApiProperty({ required: false })
  machine_model_status: boolean;
}
