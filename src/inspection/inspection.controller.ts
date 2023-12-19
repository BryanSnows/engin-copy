import { Controller, Get, Post, Query } from '@nestjs/common';
import { InspectionService } from './inspection.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Inspection } from './entities/inspection.entity';
import { FilterProductivityHours } from './dto/filter-productivity-hours';
import { FilterProductivityDate } from './dto/filter-productivity-date';

@Controller('inspection')
@ApiTags('Inspection')
@ApiBearerAuth()
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Get()
  @ApiOperation({ summary: 'List all inspections' })
  @PublicRoute()
  async findAll() {
    return await this.inspectionService.findAll();
  }

  @Get('inspection-hour')
  @ApiOperation({
    summary:
      'List all inspections by hors. Date format yyyy-mm-dd and time format with zero at the beginning',
  })
  @PublicRoute()
  async inspectionHours(@Query() filter: FilterProductivityHours): Promise<Inspection[]> {
    return await this.inspectionService.getProductivityHors(filter);
  }

  @Get('inspection-date')
  @ApiOperation({
    summary:
      'List all inspections by date. Date format yyyy-mm-dd and time format with zero at the beginning',
  })
  @PublicRoute()
  async inspectionDate(@Query() filter: FilterProductivityDate): Promise<Inspection[]> {
    return await this.inspectionService.getProductivityDate(filter);
  }

  @PublicRoute()
  @Cron(CronExpression.EVERY_10_SECONDS)
  @ApiOperation({ summary: 'Cron expression every 10 seconds ia integration' })
  @Post('save-from-redis')
  async saveFromRedis(): Promise<string> {
    try {
      await this.inspectionService.saveDataToDatabase();
      return 'Data saved successfully';
    } catch (error) {
      throw new Error('CRON IN INSPECTION - Erro ao salvar dados do Redis no banco: ' + error);
    }
  }

  @PublicRoute()
  @Cron(CronExpression.EVERY_10_SECONDS)
  @ApiOperation({ summary: 'Cron expression get every 10 seconds ia integration' })
  @Get('update-production-produced')
  async updateProductionProducedFromInspection(): Promise<string> {
    try {
      await this.inspectionService.updateProductionProducedFromInspection();
      return 'Production produced updated successfully from inspection data.';
    } catch (error) {
      throw new Error(
        'CRON IN INSPECTION - Erro ao atualizar dados de inspection em daily production: ' +
          error.message,
      );
    }
  }
}
