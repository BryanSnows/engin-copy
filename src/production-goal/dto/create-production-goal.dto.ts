import { ApiProperty } from '@nestjs/swagger';

export class CreateProductionGoalDto {
  @ApiProperty()
  production_goal_order: string;

  @ApiProperty()
  production_goal_expected: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  production_goal_start_date: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  production_goal_finish_date: string;

  @ApiProperty()
  pipe_model_id: number;
}
