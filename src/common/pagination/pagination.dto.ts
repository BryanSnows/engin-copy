import { ApiProperty } from '@nestjs/swagger';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';

export class PaginationOptionsDto implements IPaginationOptions {
  @ApiProperty({ required: false, default: 1 })
  page: number;

  @ApiProperty({ required: false, default: 10 })
  limit: number;
}
