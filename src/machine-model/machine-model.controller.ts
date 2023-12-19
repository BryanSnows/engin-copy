import { Controller, Get, Post, Body, Patch, Put, Param, UseGuards, Query } from '@nestjs/common';
import { MachineModelService } from './machine-model.service';
import { CreateMachineModelDto } from './dto/create-machine-model.dto';
import { UpdateMachineModelDto } from './dto/update-machine-model.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/auth/shared/guards/permission.guard';
import Permission from 'src/auth/enums/permissions.type';
import { MachineModel } from './entities/machine-model.entity';
import { MachineModelFilter } from './dto/filter-machine-model';
import { Pagination } from 'nestjs-typeorm-paginate';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';

@ApiTags('Machine-model')
@Controller('machine-model')
@ApiBearerAuth()
export class MachineModelController {
  constructor(private readonly machineModelService: MachineModelService) {}

  @Post()
  @UseGuards(PermissionGuard(Permission.Production.CREATE))
  @ApiOperation({ summary: 'Create Machine model' })
  async create(@Body() createMachineModelDto: CreateMachineModelDto): Promise<MachineModel> {
    return await this.machineModelService.create(createMachineModelDto);
  }

  @Get()
  @UseGuards(PermissionGuard(Permission.Production.READ))
  @ApiOperation({ summary: 'List All Machine models' })
  async findAll(@Query() filter: MachineModelFilter): Promise<Pagination<MachineModel>> {
    return await this.machineModelService.findAll(filter);
  }

  @Get('without-processes')
  @PublicRoute()
  async findMachinesWithoutProcesses(): Promise<MachineModel[]> {
    return this.machineModelService.findMachinesWithoutProcesses();
  }

  @Get('/status/machine-models-true')
  @PublicRoute()
  @ApiOperation({ summary: 'Listing Of All machine_models By Status True' })
  async getAllMachineModelsTrue(): Promise<MachineModel[]> {
    return await this.machineModelService.findMachineModels();
  }

  @Get(':machine_model_id')
  @UseGuards(PermissionGuard(Permission.Production.READ))
  @ApiOperation({ summary: 'List a Machine model' })
  async findOne(@Param('machine_model_id') machine_model_id: string): Promise<MachineModel> {
    return await this.machineModelService.findOne(+machine_model_id);
  }

  @Get('ip/:machine_model_ip')
  @UseGuards(PermissionGuard(Permission.Production.READ))
  @ApiOperation({ summary: 'List a Machine Ip' })
  async findOneByIp(@Param('machine_model_ip') machine_model_ip: string): Promise<MachineModel> {
    return await this.machineModelService.findByMachineIp(machine_model_ip);
  }

  @Put(':machine_model_id')
  @UseGuards(PermissionGuard(Permission.Production.UPDATE))
  @ApiOperation({ summary: 'Update a machine model by Id' })
  async update(
    @Param('machine_model_id') machine_model_id: string,
    @Body() updateMachineModelDto: UpdateMachineModelDto,
  ): Promise<MachineModel> {
    return await this.machineModelService.update(+machine_model_id, updateMachineModelDto);
  }

  @Patch('/status/:machine_model_id')
  @UseGuards(PermissionGuard(Permission.Production.CHANGE_STATUS))
  @ApiOperation({ summary: 'Change machine model Status' })
  async changeMachineModelStatus(
    @Param('machine_model_id') machine_model_id: string,
  ): Promise<MachineModel> {
    return await this.machineModelService.changeStatus(+machine_model_id);
  }
}
