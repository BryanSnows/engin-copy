import { Module, forwardRef } from '@nestjs/common';
import { InspectionService } from './inspection.service';
import { InspectionController } from './inspection.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inspection } from './entities/inspection.entity';
import { RedisModule } from 'src/config/cache/redis.module';
import { RedisService } from 'src/config/cache/redis.service';
import { DailyProduction } from 'src/daily-production/entities/daily-production.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inspection, DailyProduction]), RedisModule],
  controllers: [InspectionController],
  providers: [InspectionService, RedisService],
  exports: [InspectionService],
})
export class InspectionModule {}
