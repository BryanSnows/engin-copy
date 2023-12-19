import { ApiProperty } from '@nestjs/swagger';

export class ConfirmDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  email: string;
}
