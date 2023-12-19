import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptionsDto } from 'src/common/pagination/pagination.dto';

export class ProductionGoalFilter extends PaginationOptionsDto {
  @ApiProperty({ required: false })
  search: string;

  @ApiProperty({ required: false })
  production_goal_situation: number;

  @ApiProperty({ required: false })
  production_goal_elaborated: boolean;

  //   @ApiProperty({ required: false, default: 'DATE', enum: ['ASC', 'DESC'] })
  //   sort: string;

  // @ApiProperty({ required: false, default: "DATE", enum: ["FIRST_DATE", "LAST_DATE"]})
  // orderBy: string;
}
