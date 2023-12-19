import { AuthController } from './auth.controller';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './shared/strategies/jwt.strategy';
import { JwtRefreshStrategy } from './shared/strategies/jwt-refresh.strategy';
import { BasicStrategy } from './shared/strategies/basic.strategy';
import { LocalStrategy } from './shared/strategies/local.strategy';
import { UsersModule } from 'src/users/users.module';
import { JwtFirstAccessStrategy } from './shared/strategies/jwt-first-access.strategy';
import { AuthCognitoService } from './shared/aws-cognito.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtFirstAccessStrategy,
    BasicStrategy,
    AuthCognitoService,
  ],
})
export class AuthModule {}
