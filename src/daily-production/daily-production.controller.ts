import { Body, Controller, Get, NotFoundException, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DailyProductionService } from './daily-production.service';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';
import { DailyProduction } from './entities/daily-production.entity';
import { DailyProductionEditDTO } from './dto/update-daily-production.dto';

@ApiTags('Daily-production')
@Controller('daily-production')
@ApiBearerAuth()
export class DailyProductionController {
  constructor(private readonly dailyProductionService: DailyProductionService) {}

  @PublicRoute()
  @Get('/with-process')
  @ApiOperation({ summary: 'Listing Of All Daily Productions with Processes Running' })
  async getDailyProductionsWithMachines() {
    return this.dailyProductionService.getDailyProductionWithMachines();
  }

  @Get()
  @PublicRoute()
  @ApiOperation({ summary: 'List All Daily Productions' })
  async findAll(): Promise<DailyProduction[]> {
    return await this.dailyProductionService.findAll();
  }

  @Get(':productionGoalOrder')
  @PublicRoute()
  @ApiOperation({ summary: 'List Daily Productions By Op' })
  async findByProductionGoalOrder(
    @Param('productionGoalOrder') productionGoalOrder: string,
  ): Promise<DailyProduction[]> {
    const dailyProductions = await this.dailyProductionService.findByProductionGoalOrder(
      productionGoalOrder,
    );
    if (!dailyProductions || dailyProductions.length === 0) {
      throw new NotFoundException(
        `Nenhuma daily productions encontrada para production goal order: ${productionGoalOrder}`,
      );
    }
    return dailyProductions;
  }

  @PublicRoute()
  @ApiBody({ type: [DailyProductionEditDTO] })
  @Put('/edit-multiple-produced')
  async editMultipleProduced(@Body() dailyProductionEditDto: DailyProductionEditDTO[]) {
    await this.dailyProductionService.editMultipleProduced(dailyProductionEditDto);
    return { message: 'Produções diárias atualizadas com sucesso' };
  }

  @PublicRoute()
  @ApiOperation({ summary: 'List Daily Productions for today' })
  @Get('/dashboard/today')
  async findToday(): Promise<DailyProduction[]> {
    return this.dailyProductionService.getAllDailyProductionForDay();
  }
}
