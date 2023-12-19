import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { AuthDto } from '../dto/auth.dto';
import { ConfirmDto } from '../dto/confirm.dto';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ErrorResponse } from 'src/common/error-reponse';
import { CodeError } from 'src/common/enums';
import Tokens from '../dto/tokens';
import { hash, isMatchHash } from 'src/common/hash';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { createHmac } from 'crypto';
import { AuthFlowType } from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class AuthCognitoService {
  private userPool: CognitoUserPool;
  private readonly cognito: CognitoIdentityServiceProvider;
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {
    this.cognito = new CognitoIdentityServiceProvider({ region: process.env.COGNITO_REGION });
    this.userPool = new CognitoUserPool({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      ClientId: process.env.COGNITO_CLIENT_ID,
    });
  }

  private generateSecretHash(email: string): string {
    const hash = createHmac('sha256', process.env.COGNITO_CLIENT_SECRET);
    hash.update(`${email}${process.env.COGNITO_CLIENT_ID}`);
    return hash.digest('base64');
  }

  async signIn(user: AuthDto) {
    const { email, password } = user;

    const secretHash = this.generateSecretHash(email);

    const params = {
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        SECRET_HASH: secretHash,
        PASSWORD: password,
      },
    };
    const cogito = await this.cognito.initiateAuth(params).promise();
    const userSaved = await this.userService.findByEmail(user.email);
    if (!userSaved) {
      throw new NotFoundException(
        new ErrorResponse(CodeError.NOT_FOUND, `Usuário não existe no sistema cnc`),
      );
    }

    if (!userSaved.user_status) {
      throw new BadRequestException(
        new ErrorResponse(
          CodeError.IS_DESABLE,
          `Usuário desativado no sistema cnc. Entre em contato com o administrador para mais informações`,
        ),
      );
    }
    userSaved.profile.transactions = userSaved.profile.transactions.filter(
      (transaction) => transaction.transaction_status,
    );
    const transactions = userSaved.profile.transactions.map(
      (transaction) => transaction.transaction_number,
    );

    const { access_token, refresh_token } = await this.createAccessToken(
      userSaved.user_name,
      email,
      userSaved.profile.profile_id,
      userSaved.profile.profile_name,
      transactions,
    );

    await this.userService.updateRefreshToken(userSaved.user_id, await hash(refresh_token));
    return {
      access_token,
      refresh_token,
      name: userSaved.user_name,
      email,
      profile_id: userSaved.profile.profile_id,
      profile_name: userSaved.profile.profile_name,
      transactions,
      cogito,
    };
  }

  async signUp(user: AuthDto) {
    const { email, password } = user;

    const secretHash = this.generateSecretHash(email);

    return this.cognito
      .signUp({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        SecretHash: secretHash,
        UserAttributes: [{ Name: 'email', Value: email }],
      })
      .promise();
  }

  async confirmSignUp(authConfirmRegisterRequest: ConfirmDto) {
    const { email, code } = authConfirmRegisterRequest;

    const secretHash = this.generateSecretHash(email);

    return this.cognito
      .confirmSignUp({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
        SecretHash: secretHash,
      })
      .promise();
  }

  private async createAccessToken(
    name: string,
    email: string,
    profile_id: number,
    profile_name: string,
    transactions: number[],
  ): Promise<Tokens> {
    const [tokenPayload, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        {
          name: name,
          email: email,
          profile_id: profile_id,
          profile_name: profile_name,
          transactions: transactions,
        },
        {
          secret: this.configService.get('auth.token_secret'),
          expiresIn: this.configService.get('auth.token_expires_in'),
          algorithm: 'HS256',
        },
      ),
      this.jwtService.signAsync(
        {
          email: email,
        },
        {
          secret: this.configService.get('auth.refresh_token_secret'),
          expiresIn: this.configService.get('auth.refresh_token_expires_in'),
          algorithm: 'HS256',
        },
      ),
    ]);

    return {
      access_token: tokenPayload,
      refresh_token: refresh_token,
    };
  }

  async refreshToken(email: string, refreshToken: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new HttpException('Usuário com esse email não existe', HttpStatus.NOT_FOUND);
    }

    if (!user.user_refresh_token) {
      throw new HttpException('Refresh token não existe pra esse usuário', HttpStatus.NOT_FOUND);
    }

    const verifyIfHashMatch = await isMatchHash(refreshToken, user.user_refresh_token);

    if (!verifyIfHashMatch) {
      throw new HttpException('Refresh tokens não correspondem', HttpStatus.NOT_FOUND);
    }

    user.profile.transactions = user.profile.transactions.filter(
      (transaction) => transaction.transaction_status,
    );
    const transactions = user.profile.transactions.map(
      (transaction) => transaction.transaction_number,
    );

    const { access_token, refresh_token } = await this.createAccessToken(
      user.user_name,
      email,
      user.profile.profile_id,
      user.profile.profile_name,
      transactions,
    );

    await this.userService.updateRefreshToken(user.user_id, await hash(refresh_token));

    return {
      access_token: access_token,
      refresh_token: refresh_token,
      name: user.user_name,
      profile: user.profile.profile_name,
      expires_in: this.configService.get('auth.refresh_token_expires_in'),
    };
  }

  async removeRefreshToken(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new HttpException('Usuário com esse email não existe', HttpStatus.NOT_FOUND);
    }
    const item = await this.userService.updateRefreshToken(user.user_id, null);
    return {
      item,
      message: 'Logout feito com sucesso',
    };
  }
}
