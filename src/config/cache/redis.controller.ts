import { Controller, Get, Param } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';

@Controller('redis')
@ApiTags('Redis')
@ApiBearerAuth()
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @PublicRoute()
  @ApiOperation({ summary: 'List Cache By Key' })
  @Get(':key')
  async getValueByKey(@Param('key') key: string): Promise<string | null> {
    const value = await this.redisService.get(key);
    return value;
  }

  @PublicRoute()
  @ApiOperation({ summary: 'List All Posto01 Key' })
  @Get('posto01')
  async getPosto01Value(): Promise<string | null> {
    const key = 'posto01';
    const value = await this.redisService.get(key);
    return value;
  }
}