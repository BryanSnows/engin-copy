import { ApiProperty } from '@nestjs/swagger';

export class ProcessFilter {
  @ApiProperty({ required: false })
  search: string;
}
