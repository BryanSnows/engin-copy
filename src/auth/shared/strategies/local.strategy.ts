import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { CodeError, VerifyCredentials } from 'src/common/enums';
import { UsersService } from 'src/users/users.service';
import { ErrorResponse } from 'src/common/error-reponse';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UsersService) {
    super({
      usernameField: VerifyCredentials.verify_email,
      passwordField: VerifyCredentials.verify_password,
    });
  }

  async validate(email: string, password: string): Promise<any> {}
}
