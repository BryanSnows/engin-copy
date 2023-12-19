import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProductionGoalService } from './production-goal.service';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';
import { CreateProductionGoalDto } from './dto/create-production-goal.dto';
import { ProductionGoal } from './entities/production-goal.entity';
import { PaginationPipe } from 'src/common/pipes/pagination.pipe';
import { ProductionGoalFilter } from './dto/filter-production-goal.dto';
import { PermissionGuard } from 'src/auth/shared/guards/permission.guard';
import Permission from 'src/auth/enums/permissions.type';
import { UpdateProductionGoalDto } from './dto/update-production-goal.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadDto } from './dto/file-update-excel.dto';

@ApiTags('Production-goal')
@Controller('production-goal')
@ApiBearerAuth()
export class ProductionGoalController {
  constructor(private readonly productionGoalService: ProductionGoalService) {}

  @Post()
  @ApiOperation({ summary: 'Create an Production Goal' })
  @UseGuards(PermissionGuard(Permission.ProductionGoal.CREATE))
  async create(@Body() createProductionGoalDto: CreateProductionGoalDto): Promise<ProductionGoal> {
    return this.productionGoalService.create(createProductionGoalDto);
  }

  @PublicRoute()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel file',
    type: FileUploadDto,
  })
  async uploadExcelFile(@UploadedFile() file) {
    const data = await this.productionGoalService.createProcessExcel(file);
    return { data };
  }

  @Put(':id')
  @UseGuards(PermissionGuard(Permission.ProductionGoal.UPDATE))
  @ApiOperation({ summary: 'Update Production Goal' })
  async updateProductionGoal(@Param('id') id: number, @Body() updateDto: UpdateProductionGoalDto) {
    const updatedGoal = await this.productionGoalService.updateProductionGoal(+id, updateDto);

    if (!updatedGoal) {
      throw new NotFoundException('Meta de produção não encontrada');
    }

    return updatedGoal;
  }

  @Get()
  @UseGuards(PermissionGuard(Permission.ProductionGoal.READ))
  @ApiOperation({ summary: 'List All Production Goal' })
  findAll(@Query(PaginationPipe) filter: ProductionGoalFilter) {
    return this.productionGoalService.getAll(filter);
  }

  @Get('/order/:production_goal_order')
  @UseGuards(PermissionGuard(Permission.ProductionGoal.READ))
  @ApiOperation({ summary: 'Find By Production Goal Order' })
  async getProductionGoalOrder(
    @Param('production_goal_order') production_goal_order: string,
  ): Promise<ProductionGoal> {
    return this.productionGoalService.getProductionGoalOrder(production_goal_order);
  }

  @Get('/:id')
  @UseGuards(PermissionGuard(Permission.ProductionGoal.READ))
  @ApiOperation({ summary: 'Find By Production Goal Id' })
  async getById(@Param('id') production_goal_id: number): Promise<ProductionGoal> {
    return this.productionGoalService.findById(production_goal_id);
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  @ApiExcludeEndpoint()
  @Get('/cron/checkSituation3')
  @PublicRoute()
  @ApiOperation({ summary: 'Request Automation To Check Situation 3' })
  async checkSituation3() {
    return await this.productionGoalService.checkAndUpdateProductionGoalAndForAll();
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  @ApiExcludeEndpoint()
  @Get('/cron/checkSituation4')
  @PublicRoute()
  @ApiOperation({ summary: 'Request Automation To Check Situation 4' })
  async checkSituation4() {
    return await this.productionGoalService.checkAndUpdateProductionGoalStatusForAll();
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  @ApiExcludeEndpoint()
  @Get('/cron/checkElaboratedStatus')
  @PublicRoute()
  async checkElaboratedStatus() {
    return await this.productionGoalService.changeElaboratedStatusForAll();
  }
}
