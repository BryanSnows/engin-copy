import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePipeModelDto {
  @ApiProperty()
  pipe_model_name: string;

  @ApiProperty()
  pipe_model_code: string;

  @ApiProperty()
  pipe_model_length: number;

  @ApiProperty()
  pipe_model_diameter: string;

  @ApiProperty()
  pipe_model_expansion: boolean;

  @ApiProperty()
  pipe_model_reduction: boolean;

  @ApiProperty()
  pipe_model_folds: number;

  @ApiPropertyOptional({ type: () => [PipeModelAngleDto] })
  pipe_angles?: PipeModelAngleDto[];
}

export class PipeModelAngleDto {
  @ApiProperty()
  angle_id: number;

  @ApiProperty()
  angle_order: number;
}
