import { ApiProperty } from '@nestjs/swagger';

export class FilterProductivityDate {
  @ApiProperty({ required: false })
  inspection_pipe_model_id: number;

  @ApiProperty({ required: false })
  inspection_machine_model_id: number;

  @ApiProperty({ required: false })
  start_date: string;

  @ApiProperty({ required: false })
  end_date: string;
}
