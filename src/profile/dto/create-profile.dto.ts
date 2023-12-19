import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty()
  profile_name: string;

  @ApiProperty({ required: false, type: [Number] })
  transaction_id?: number[];
}
