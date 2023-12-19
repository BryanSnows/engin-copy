import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({ example: 'bryan.nevesp@gmail.com' })
  email: string;

  @ApiProperty({ example: '!&1ZxLrdKE9%WC' })
  password: string;
}
