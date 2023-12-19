import { Pagination } from 'nestjs-typeorm-paginate';
import { BufferedFile } from 'src/common/services/minio/interfaces/file.interface';
import { CreatePipeModelDto } from 'src/pipe-model/dto/create-pipe-model.dto';
import { PipeModelFilter } from 'src/pipe-model/dto/filter-pipe-model.dto';
import { UpdatePipeModelDto } from 'src/pipe-model/dto/update-pipe-model.dto';
import { PipeModel } from 'src/pipe-model/entities/pipe-model.entity';

export interface PipeModelServiceInterface {
  findByPipeName(name: string): Promise<PipeModel | undefined>;
  findByPipeCode(code: string): Promise<PipeModel | undefined>;
  findByPipeNameAndId(name: string): Promise<PipeModel | undefined>;
  create(createPipeModelDto: CreatePipeModelDto, file: BufferedFile): Promise<PipeModel>;

  update(
    pipe_model_id: number,
    updatePipeModelDto: UpdatePipeModelDto,
    file: BufferedFile,
  ): Promise<PipeModel>;

  findAll(filter: PipeModelFilter): Promise<Pagination<PipeModel>>;
  findPipeModels(): Promise<PipeModel[]>;
  findByPipeId(pipe_model_id: number): Promise<PipeModel>;
  findOne(pipe_model_id: number): Promise<PipeModel>;
  changeStatus(pipe_model_id: number): Promise<PipeModel>;
}
