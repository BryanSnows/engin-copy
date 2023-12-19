import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptionsDto } from 'src/common/pagination/pagination.dto';

export class UserFilter extends PaginationOptionsDto {
  @ApiProperty({ required: false })
  search: string;

  @ApiProperty({ required: false })
  user_status: boolean;
}
