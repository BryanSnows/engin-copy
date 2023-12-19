import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePdfDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  file: any;
}
