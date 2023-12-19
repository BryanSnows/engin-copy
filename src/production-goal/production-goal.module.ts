import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionGoal } from './entities/production-goal.entity';
import { ProductionGoalController } from './production-goal.controller';
import { ProductionGoalService } from './production-goal.service';
import { Module } from '@nestjs/common';
import { PipeModelModule } from 'src/pipe-model/pipe-model.module';
import { DailyProductionService } from 'src/daily-production/daily-production.service';
import { DailyProductionModule } from 'src/daily-production/daily-production.module';
import { DailyProduction } from 'src/daily-production/entities/daily-production.entity';
import { MulterModule } from '@nestjs/platform-express/multer';
@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionGoal, DailyProduction]),
    MulterModule.register({
      dest: './uploads',
    }),
    DailyProductionModule,
    PipeModelModule,
  ],
  controllers: [ProductionGoalController],
  providers: [ProductionGoalService, DailyProductionService],
  exports: [ProductionGoalService, DailyProductionService],
})
export class ProductionGoalModule {}
