import { Pagination } from 'nestjs-typeorm-paginate';
import { BufferedFile } from 'src/common/services/minio/interfaces/file.interface';
import { CreatePipeModelDto } from 'src/pipe-model/dto/create-pipe-model.dto';
import { PipeModelFilter } from 'src/pipe-model/dto/filter-pipe-model.dto';
import { UpdatePipeModelDto } from 'src/pipe-model/dto/update-pipe-model.dto';
import { Angle } from 'src/pipe-model/entities/angle.entity';
import { PipeModel } from 'src/pipe-model/entities/pipe-model.entity';

export interface PipeModelControllerInterface {
  create(createPipeModelDto: CreatePipeModelDto, file: BufferedFile, Request: Request): any;
  findAll(filter: PipeModelFilter): Promise<Pagination<PipeModel>>;
  findOne(pipe_model_id: number): Promise<any>;
  getAllPipeModelsTrue(): Promise<PipeModel[]>;
  getAllAngles(): Promise<Angle[]>;
  changePipeModelStatus(pipe_model_id: number): Promise<PipeModel>;
  update(
    pipe_model_id: number,
    updatePipeModelDto: UpdatePipeModelDto,
    file: BufferedFile,
  ): Promise<any>;
}
