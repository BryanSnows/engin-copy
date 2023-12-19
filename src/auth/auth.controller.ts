import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Param,
  Get,
} from '@nestjs/common';
import { PublicRoute } from 'src/common/decorators/public_route.decorator';
import { AuthCognitoService } from './shared/aws-cognito.service';
import { AuthDto } from './dto/auth.dto';
import { ConfirmDto } from './dto/confirm.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './shared/guards/jwt-refresh-auth.guard';

@Controller('auth')
@ApiTags('Login')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authCognitoService: AuthCognitoService) {}

  @PublicRoute()
  @ApiOperation({ summary: 'Authentication Login' })
  @Post('/login')
  async login(@Body() authenticateRequest: AuthDto) {
    try {
      return await this.authCognitoService.signIn(authenticateRequest);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  @PublicRoute()
  @ApiOperation({ summary: 'Creating user in aws cognition' })
  @Post('/aws/register')
  async register(@Body() authRegisterRequest: AuthDto) {
    try {
      return await this.authCognitoService.signUp(authRegisterRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  // @PublicRoute()
  @ApiOperation({ summary: 'Confirming email using AWS confirmation code' })
  @Post('/aws/confirm')
  async confirm(@Body() authConfirmRegisterRequest: ConfirmDto) {
    try {
      return await this.authCognitoService.confirmSignUp(authConfirmRegisterRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('/refresh_token')
  @ApiOperation({ summary: 'Refresh Token for Longer Authentication Time' })
  @PublicRoute()
  @UseGuards(JwtRefreshAuthGuard)
  async refreshToken(@Request() payload: any) {
    return this.authCognitoService.refreshToken(payload.user.email, payload.user.refresh_token);
  }

  @Post('/logout')
  @ApiOperation({ summary: 'Logout System' })
  @UseGuards(JwtAuthGuard)
  async logout(@Request() payload: any) {
    return this.authCognitoService.removeRefreshToken(payload.user.email);
  }
}
