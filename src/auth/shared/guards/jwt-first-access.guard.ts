import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtFirstAccessAuthGuard extends AuthGuard('jwt-first-access') {}