import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  currentPassword: string;

  @ApiProperty()
  newPassword: string;
}
