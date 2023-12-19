import { Module } from '@nestjs/common';
import { PipeModelService } from './pipe-model.service';
import { PipeModelController } from './pipe-model.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipeModel } from './entities/pipe-model.entity';
import { MinioClientModule } from 'src/common/services/minio/minio-client.module';
import { PipeModelAngleService } from './pipe-model-angle.service';
import { PipeModelAngle } from './entities/pipe-model-angle.entity';
import { Angle } from './entities/angle.entity';
import { AngleService } from './angles.service';

@Module({
  imports: [TypeOrmModule.forFeature([PipeModel, PipeModelAngle, Angle]), MinioClientModule],
  controllers: [PipeModelController],
  providers: [PipeModelService, PipeModelAngleService, AngleService],
  exports: [PipeModelService, PipeModelAngleService, AngleService],
})
export class PipeModelModule {}
