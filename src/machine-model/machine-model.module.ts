import { Module } from '@nestjs/common';
import { MachineModelService } from './machine-model.service';
import { MachineModelController } from './machine-model.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachineModel } from './entities/machine-model.entity';
import { RedisService } from 'src/config/cache/redis.service';

@Module({
  imports: [TypeOrmModule.forFeature([MachineModel])],
  controllers: [MachineModelController],
  providers: [MachineModelService, RedisService],
  exports: [MachineModelService],
})
export class MachineModelModule {}
