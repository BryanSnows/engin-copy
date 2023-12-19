import { PipeModelAngle } from 'src/pipe-model/entities/pipe-model-angle.entity';

export interface PipeModelAngleServiceInterface {
  create(pipeModelAngle: PipeModelAngle): Promise<PipeModelAngle>;
}
