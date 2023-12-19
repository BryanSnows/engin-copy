import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessService } from './process.service';
import { ProcessController } from './process.controller';
import { MachineModelModule } from '../machine-model/machine-model.module';
import { ProductionGoalModule } from '../production-goal/production-goal.module';
import { Process } from './entities/process.entity';
import { MachineModel } from 'src/machine-model/entities/machine-model.entity';
import { RedisService } from 'src/config/cache/redis.service';
import { DailyProduction } from 'src/daily-production/entities/daily-production.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Process, MachineModel, DailyProduction]),
    MachineModelModule,
    ProductionGoalModule,
  ],
  providers: [ProcessService, RedisService],
  controllers: [ProcessController],
  exports: [ProcessService],
})
export class ProcessModule {}
