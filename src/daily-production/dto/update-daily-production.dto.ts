import { ApiProperty } from '@nestjs/swagger';

export class DailyProductionEditDTO {
  @ApiProperty()
  daily_production_id: number;

  @ApiProperty()
  daily_production_goal: number;
}
