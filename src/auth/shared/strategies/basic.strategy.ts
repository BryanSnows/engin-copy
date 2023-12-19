import { BasicStrategy as Strategy } from 'passport-http';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            passReqToCallback: true
        });
    }

    public validate = async (request: Request, username: string, password: string): Promise<boolean> => {
        if (
            this.configService.get<string>('HTTP_BASIC_USER') === username &&
            this.configService.get<string>('HTTP_BASIC_PASS') === password
        ) {
            return true;
        }
        throw new UnauthorizedException();
    }
}