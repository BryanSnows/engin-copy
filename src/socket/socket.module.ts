import { Module, OnModuleInit } from '@nestjs/common';
import { RealtimeGateway } from './socket.gateway';
import { RedisService } from 'src/config/cache/redis.service';
import { ProcessService } from 'src/process/process.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Process } from 'src/process/entities/process.entity';
import { MachineModel } from 'src/machine-model/entities/machine-model.entity';
import { DailyProduction } from 'src/daily-production/entities/daily-production.entity';
import { MachineModelModule } from 'src/machine-model/machine-model.module';
import { ProductionGoalModule } from 'src/production-goal/production-goal.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Process, MachineModel, DailyProduction]),
    MachineModelModule,
    ProductionGoalModule,
  ],
  providers: [RealtimeGateway, RedisService, ProcessService],
})
export class SocketModule implements OnModuleInit {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  onModuleInit() {
    this.realtimeGateway.sendRealtimeData();
  }
}
