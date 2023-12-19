import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  user_name: string;

  @ApiProperty({ example: 'example@example.com' })
  user_email: string;

  @ApiProperty()
  profile_id: number;
}
