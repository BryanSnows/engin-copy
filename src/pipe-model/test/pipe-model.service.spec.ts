import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MinioClientService } from 'src/common/services/minio/minio-client.service';
import { PipeModelService } from '../pipe-model.service';
import { PipeModel } from '../entities/pipe-model.entity';
import { AngleService } from '../angles.service';

describe('PipeModelService', () => {
  let pipeModelService: PipeModelService;
  let pipeModelRepository: Repository<PipeModel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipeModelService,
        MinioClientService,
        AngleService,
        {
          provide: getRepositoryToken(PipeModel),
          useClass: Repository,
        },
      ],
    }).compile();

    pipeModelService = module.get<PipeModelService>(PipeModelService);
    pipeModelRepository = module.get<Repository<PipeModel>>(getRepositoryToken(PipeModel));
  });
});
