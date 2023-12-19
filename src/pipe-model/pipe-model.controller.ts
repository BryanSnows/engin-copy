import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { PipeModelService } from './pipe-model.service';
import { CreatePipeModelDto } from './dto/create-pipe-model.dto';
import { UpdatePipeModelDto } from './dto/update-pipe-model.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BufferedFile } from 'src/common/services/minio/interfaces/file.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionGuard } from 'src/auth/shared/guards/permission.guard';
import Permission from 'src/auth/enums/permissions.type';
import { PipeModelFilter } from './dto/filter-pipe-model.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { PipeModel } from './entities/pipe-model.entity';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';
import { AngleService } from './angles.service';
import { Angle } from './entities/angle.entity';
import { PipeModelControllerInterface } from './interface/controller/pipe-model.controller.interface';
import { UpdatePdfDto } from './dto/update-pdf.dto';

@ApiTags('Pipe-model')
@Controller('pipe-model')
@ApiBearerAuth()
export class PipeModelController implements PipeModelControllerInterface {
  constructor(
    private readonly pipeModelService: PipeModelService,
    private readonly angleService: AngleService,
  ) {}

  @Post()
  @UseGuards(PermissionGuard(Permission.Production.CREATE))
  @ApiBody({
    type: CreatePipeModelDto,
    required: true,
    description: 'Object containing pipe model data',
  })
  @ApiOperation({ summary: 'Create Pipe model' })
  create(@Body() createPipeModelDto: CreatePipeModelDto) {
    return this.pipeModelService.create(createPipeModelDto);
  }

  @Get()
  @UseGuards(PermissionGuard(Permission.Production.READ))
  @ApiOperation({ summary: 'List All Pipe models' })
  async findAll(@Query() filter: PipeModelFilter): Promise<Pagination<PipeModel>> {
    return await this.pipeModelService.findAll(filter);
  }

  @Get(':pipe_model_id')
  @UseGuards(PermissionGuard(Permission.Production.READ))
  async findOne(@Param('pipe_model_id') pipe_model_id: number) {
    return await this.pipeModelService.findByPipeId(pipe_model_id);
  }

  @Get('/status/pipe-models-true')
  @PublicRoute()
  @ApiOperation({ summary: 'Listing Of All pipe_models By Status True' })
  async getAllPipeModelsTrue(): Promise<PipeModel[]> {
    return await this.pipeModelService.findPipeModels();
  }

  @Get('/angles/list-all-angles')
  @PublicRoute()
  @ApiOperation({ summary: 'Listing Of All Angles' })
  async getAllAngles(): Promise<Angle[]> {
    return await this.angleService.listAllAngles();
  }

  @Patch('/status/:pipe_model_id')
  @UseGuards(PermissionGuard(Permission.Production.CHANGE_STATUS))
  @ApiOperation({ summary: 'Change Pipe model Status' })
  async changePipeModelStatus(@Param('pipe_model_id') pipe_model_id: number): Promise<PipeModel> {
    return await this.pipeModelService.changeStatus(pipe_model_id);
  }

  @Put('/:pipe_model_id')
  @ApiBody({
    type: UpdatePipeModelDto,
    required: true,
    description: 'Object containing pipe model data',
  })
  @UseGuards(PermissionGuard(Permission.Production.UPDATE))
  @ApiOperation({ summary: 'Update a pipe model by Id' })
  async update(
    @Param('pipe_model_id') pipe_model_id: number,
    @Body() updatePipeModelDto: UpdatePipeModelDto,
  ) {
    return await this.pipeModelService.update(pipe_model_id, updatePipeModelDto);
  }

  @Put('/pdf/:pipe_model_id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdatePdfDto,
    required: true,
    description: 'Object containing pipe model data',
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(PermissionGuard(Permission.Production.UPDATE))
  @ApiOperation({ summary: 'Update pdf a pipe model by Id' })
  async updatePdf(
    @Param('pipe_model_id') pipe_model_id: number,
    @Body() updatePdfDto: UpdatePdfDto,
    @UploadedFile() file: BufferedFile,
  ) {
    return await this.pipeModelService.updatePdf(pipe_model_id, file, updatePdfDto);
  }
}
