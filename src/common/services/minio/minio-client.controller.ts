import { Controller, Get, Query, Response } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response as ResponseInterface } from 'express';
import { RequestFileDto } from './dtos/request-file.dto';
import { MinioClientService } from './minio-client.service';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';

@ApiTags('Minio')
@Controller('minio')
export class MinioClientController {
  constructor(private readonly minioClientService: MinioClientService) {}

  @PublicRoute()
  @Get()
  @ApiOperation({ summary: 'Endpoint To Download Pdf File Directly From Bucket' })
  async getFile(
    @Query() filter: RequestFileDto,
    @Response() response: ResponseInterface,
  ) {
    return this.minioClientService.get(filter, response);
  }
}
