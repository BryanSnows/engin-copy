import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptionsDto } from 'src/common/pagination/pagination.dto';

export class FilterProfile extends PaginationOptionsDto {
  @ApiProperty({ required: false })
  profile_name: string;

  @ApiProperty({ required: false})
  profile_status: boolean;
}
