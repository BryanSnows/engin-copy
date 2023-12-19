import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class ProcessCreateDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  machine_model_ids: number[];

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  daily_production_id: number;
}
