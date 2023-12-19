import { Injectable, Request } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from  "passport-jwt";


@Injectable()
export class JwtFirstAccessStrategy extends PassportStrategy(Strategy, 'jwt-first-access') {
    constructor(
        private readonly configService: ConfigService,
    ) {
        
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('auth.first_access_token_secret'),
            passReqToCallback: true
        });
    }

    async validate(@Request() request: Request, payload: any): Promise<any> {
        const refresh_token = request.headers['authorization'].replace('Bearer', '').trim()
        return {
            user_login: payload?.enrollment,
            refresh_token: refresh_token,
        };
    }
 }
 