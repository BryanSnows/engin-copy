import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PipeModelAngle } from './entities/pipe-model-angle.entity';
import { Repository } from 'typeorm';
import { PipeModelAngleServiceInterface } from './interface/service/pipe-model-angle.service.interface';

@Injectable()
export class PipeModelAngleService implements PipeModelAngleServiceInterface {
  constructor(
    @InjectRepository(PipeModelAngle)
    private pipeModelAngleRepository: Repository<PipeModelAngle>,
  ) {}

  async create(pipeModelAngleRepository: PipeModelAngle): Promise<PipeModelAngle> {
    return this.pipeModelAngleRepository.save(pipeModelAngleRepository);
  }
}
