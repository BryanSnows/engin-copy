import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule } from './config/environments/config.module';
import { SwaggerModule } from './config/swagger/swagger.module';
import { DatabaseModule } from './config/database/database.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/shared/guards/jwt-auth.guard';
import { AccessControlModule } from './access-control/access-control.module';
import { ProfileModule } from './profile/profile.module';
import { MinioClientModule } from './common/services/minio/minio-client.module';
import { PipeModelModule } from './pipe-model/pipe-model.module';
import { SocketModule } from './socket/socket.module';
import { MachineModelModule } from './machine-model/machine-model.module';
import { ProductionGoalModule } from './production-goal/production-goal.module';
import { ProcessModule } from './process/process.module';
import { DailyProductionModule } from './daily-production/daily-production.module';
import { InspectionModule } from './inspection/inspection.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    AccessControlModule,
    UsersModule,
    ProfileModule,
    SwaggerModule,
    MinioClientModule,
    PipeModelModule,
    SocketModule,
    MachineModelModule,
    ProductionGoalModule,
    DailyProductionModule,
    ProcessModule,
    InspectionModule,
    LoggerModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
