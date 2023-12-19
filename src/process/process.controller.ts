import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { ProcessService } from './process.service';
import { Process } from './entities/process.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProcessCreateDto } from './dto/process-create.dto';
import { MachineStatusDto } from './dto/machine-status.dto';
import Permission from 'src/auth/enums/permissions.type';
import { PermissionGuard } from 'src/auth/shared/guards/permission.guard';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';
import { ProcessFilter } from './dto/filter-process.dto';
import { Pagination } from 'nestjs-typeorm-paginate';

@Controller('process')
@ApiTags('Process')
@ApiBearerAuth()
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @PublicRoute()
  @Get('/machine/byMachineName')
  @ApiOperation({ summary: 'Listing Of All Machine Processes By Machine Name' })
  async getAllProcessesWithMachineName(@Query() filter: ProcessFilter): Promise<Process[]> {
    return await this.processService.getAllProcessesWithMachineName(filter);
  }

  @UseGuards(PermissionGuard(Permission.Process.CREATE))
  @Post()
  @ApiOperation({ summary: 'Main Setup Screen To Link A Machine To A Goal' })
  async createProcess(@Body() processDto: ProcessCreateDto): Promise<Process[]> {
    return this.processService.createProcess(processDto);
  }

  @PublicRoute()
  @Patch('/changeStatus/:machineModelIp')
  @ApiOperation({ summary: 'Machine Status Trigger' })
  async changeProcessStatusByMachineIp(@Param('machineModelIp') machineModelIp: string) {
    return this.processService.changeProcessStatusByMachineIp(machineModelIp);
  }
}
