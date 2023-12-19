import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyProduction } from './entities/daily-production.entity';
import { DailyProductionController } from './daily-production.controller';
import { DailyProductionService } from './daily-production.service';
import { Module } from '@nestjs/common';
import { ProductionGoal } from 'src/production-goal/entities/production-goal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyProduction, ProductionGoal])],
  controllers: [DailyProductionController],
  providers: [DailyProductionService],
  exports: [DailyProductionService],
})
export class DailyProductionModule {}
