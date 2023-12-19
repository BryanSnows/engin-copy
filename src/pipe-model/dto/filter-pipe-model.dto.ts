import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptionsDto } from 'src/common/pagination/pagination.dto';

export class PipeModelFilter extends PaginationOptionsDto {
  @ApiProperty({ required: false })
  search: string;

  @ApiProperty({ required: false })
  pipe_model_status: boolean;
}
