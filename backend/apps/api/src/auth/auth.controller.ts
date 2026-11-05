import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthChannel } from '@saru/database';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/permissions.decorator';
import { AuthService } from './auth.service';
import type { AuthUserContext } from './auth.types';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Web/browser login (HttpOnly cookie session)' })
  async webLogin(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-client') client?: string,
  ) {
    const channel =
      client?.toLowerCase() === 'mobile' ? AuthChannel.MOBILE : AuthChannel.WEB;
    const result = await this.auth.login({
      email: body.email,
      password: body.password,
      rememberMe: body.rememberMe,
      channel,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    if (channel === AuthChannel.WEB) {
      this.setSessionCookies(
        res,
        result.accessToken!,
        result.refreshTokenRaw,
        body.rememberMe,
      );
      return {
        session: result.session,
        requiresMfa: false,
      };
    }

    return {
      session: result.session,
      accessToken: result.accessToken,
      refreshToken: result.refreshTokenRaw,
      requiresMfa: false,
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('mobile/login')
  @ApiOperation({ summary: 'Mobile login (Bearer + refresh tokens)' })
  async mobileLogin(@Body() body: LoginDto, @Req() req: Request) {
    const result = await this.auth.login({
      email: body.email,
      password: body.password,
      rememberMe: body.rememberMe,
      channel: AuthChannel.MOBILE,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      deviceLabel: 'mobile',
    });
    return {
      session: result.session,
      accessToken: result.accessToken,
      refreshToken: result.refreshTokenRaw,
    };
  }

  @Public()
  @Post('web/refresh')
  async webRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshName = 'saru_refresh';
    const cookies = (req as Request & { cookies?: Record<string, string> })
      .cookies;
    const token = cookies?.[refreshName];
    const result = await this.auth.refresh({
      refreshToken: token ?? '',
      channel: AuthChannel.WEB,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    this.setSessionCookies(res, result.accessToken!, result.refreshTokenRaw);
    return { session: result.session };
  }

  @Public()
  @Post('mobile/refresh')
  async mobileRefresh(
    @Body() body: { refreshToken: string },
    @Req() req: Request,
  ) {
    const result = await this.auth.refresh({
      refreshToken: body.refreshToken,
      channel: AuthChannel.MOBILE,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    return {
      session: result.session,
      accessToken: result.accessToken,
      refreshToken: result.refreshTokenRaw,
    };
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiCookieAuth()
  async logout(
    @CurrentUser() user: AuthUserContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(user.sessionId, user.id);
    this.clearSessionCookies(res);
    return;
  }

  @Post('mobile/logout')
  @ApiBearerAuth()
  async mobileLogout(@CurrentUser() user: AuthUserContext) {
    await this.auth.logout(user.sessionId, user.id);
    return { ok: true };
  }

  @Get('session')
  @ApiBearerAuth()
  @ApiCookieAuth()
  async session(@CurrentUser() user: AuthUserContext) {
    return this.auth.getSession(user.id, user.sessionId);
  }

  @Get('me')
  @ApiBearerAuth()
  async me(@CurrentUser() user: AuthUserContext) {
    const session = await this.auth.getSession(user.id, user.sessionId);
    return session.user;
  }

  @Get('sessions')
  async sessions(@CurrentUser() user: AuthUserContext) {
    return { data: await this.auth.listSessions(user.id) };
  }

  @Delete('sessions/:id')
  async revokeSession(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
  ) {
    await this.auth.revokeSession(user.id, id);
    return { ok: true };
  }

  @Public()
  @Post('forgot-password')
  async forgot(@Body() body: ForgotPasswordDto) {
    await this.auth.requestPasswordReset(body.email);
    return;
  }

  @Public()
  @Post('reset-password')
  async reset(@Body() body: ResetPasswordDto) {
    await this.auth.resetPassword(
      body.token,
      body.password,
      body.confirmPassword,
    );
    return;
  }

  @Post('change-password')
  async change(
    @CurrentUser() user: AuthUserContext,
    @Body() body: ChangePasswordDto,
  ) {
    await this.auth.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
    return { ok: true };
  }

  private cookieSameSite(): 'lax' | 'strict' | 'none' {
    const raw = (
      this.config.get<string>('SESSION_COOKIE_SAMESITE') ?? ''
    ).toLowerCase();
    if (raw === 'none' || raw === 'lax' || raw === 'strict') return raw;
    // Cross-origin admin (Vercel) → API (Railway) requires SameSite=None + Secure
    return this.config.get<string>('SESSION_COOKIE_SECURE') === 'true'
      ? 'none'
      : 'lax';
  }

  private setSessionCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    rememberMe?: boolean,
  ) {
    const secure = this.config.get<string>('SESSION_COOKIE_SECURE') === 'true';
    const sameSite = this.cookieSameSite();
    const cookieName = this.config.get<string>(
      'SESSION_COOKIE_NAME',
      'saru_session',
    );
    const csrfName = this.config.get<string>('CSRF_COOKIE_NAME', 'XSRF-TOKEN');
    const maxAge = rememberMe ? 30 * 86_400_000 : 7 * 86_400_000;

    if (sameSite === 'none' && !secure) {
      throw new Error(
        'SESSION_COOKIE_SAMESITE=none requires SESSION_COOKIE_SECURE=true',
      );
    }

    res.cookie(cookieName, accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: 15 * 60_000,
    });
    res.cookie('saru_refresh', refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/api/auth',
      maxAge,
    });
    // Readable CSRF cookie for double-submit pattern
    res.cookie(csrfName, randomCsrf(), {
      httpOnly: false,
      secure,
      sameSite,
      path: '/',
      maxAge,
    });
  }

  private clearSessionCookies(res: Response) {
    const secure = this.config.get<string>('SESSION_COOKIE_SECURE') === 'true';
    const sameSite = this.cookieSameSite();
    const cookieName = this.config.get<string>(
      'SESSION_COOKIE_NAME',
      'saru_session',
    );
    const csrfName = this.config.get<string>('CSRF_COOKIE_NAME', 'XSRF-TOKEN');
    const base = { secure, sameSite };
    res.clearCookie(cookieName, { ...base, path: '/' });
    res.clearCookie('saru_refresh', { ...base, path: '/api/auth' });
    res.clearCookie(csrfName, { ...base, path: '/' });
  }
}

function randomCsrf() {
  return randomBytes(24).toString('base64url');
}
