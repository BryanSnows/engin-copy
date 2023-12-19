import { ApiProperty } from '@nestjs/swagger';

export class FilterProductivityHours {
  @ApiProperty({ required: false })
  inspection_pipe_model_id: number;

  @ApiProperty({ required: false })
  inspection_machine_model_id: number;

  @ApiProperty({ required: false })
  inspection_daily_production_date: string;

  @ApiProperty({ required: false })
  start_hour: number;

  @ApiProperty({ required: false })
  end_hour: number;
}
