import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AuthChannel } from '@saru/database';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import type { AuthUserContext, SystemRole } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const header = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
          if (header) return header;
          const cookieName = config.get<string>(
            'SESSION_COOKIE_NAME',
            'saru_session',
          );
          const cookies = (
            req as Request & { cookies?: Record<string, string> }
          ).cookies;
          return cookies?.[cookieName] ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    sid: string;
    role: SystemRole;
    channel: AuthChannel;
  }): Promise<AuthUserContext> {
    return this.authService.validateAccessPayload(payload);
  }
}
