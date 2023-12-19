import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PipeModelAngleService } from '../pipe-model-angle.service';
import { PipeModelAngle } from '../entities/pipe-model-angle.entity';
import { PipeModel } from '../entities/pipe-model.entity';

describe('PipeModelAngleService', () => {
  let pipeModelAngleService: PipeModelAngleService;
  let pipeModelAngleRepository: Repository<PipeModelAngle>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipeModelAngleService,
        {
          provide: getRepositoryToken(PipeModelAngle),
          useClass: Repository,
        },
      ],
    }).compile();

    pipeModelAngleService = module.get<PipeModelAngleService>(PipeModelAngleService);
    pipeModelAngleRepository = module.get<Repository<PipeModelAngle>>(
      getRepositoryToken(PipeModelAngle),
    );
  });

  describe('create', () => {
    it('should create a PipeModelAngle', async () => {
      const mockPipeModelAngle: PipeModelAngle = {
        pipe_model_angles_id: 0,
        pipe_model_id: 0,
        angle_id: 0,
        pipeModel: new PipeModel(),
        angles: new PipeModel(),
      };
      jest.spyOn(pipeModelAngleRepository, 'save').mockResolvedValue(mockPipeModelAngle);

      const result = await pipeModelAngleService.create(mockPipeModelAngle);

      expect(result).toEqual(mockPipeModelAngle);
    });
  });
});
