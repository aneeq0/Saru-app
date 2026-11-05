import { createHash, randomBytes, randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthChannel, UserStatus } from '@saru/database';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { AuditService } from '../audit/audit.service';
import {
  AuthUserContext,
  AuthUserDto,
  LoginResponseDto,
  ROLE_LABELS,
  SessionInfoDto,
  SystemRole,
} from './auth.types';

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(params: {
    email: string;
    password: string;
    channel: AuthChannel;
    rememberMe?: boolean;
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
    deviceLabel?: string;
  }): Promise<
    LoginResponseDto & { refreshTokenRaw: string; sessionId: string }
  > {
    const email = params.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        credential: true,
        department: true,
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
        permissionOverrides: { include: { permission: true } },
      },
    });

    if (!user?.credential) {
      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid email or password',
        401,
      );
    }

    if (
      user.credential.lockedUntil &&
      user.credential.lockedUntil > new Date()
    ) {
      throw new AppError(
        ErrorCodes.ACCOUNT_LOCKED,
        'Account is temporarily locked',
        403,
      );
    }

    if (
      user.status === UserStatus.INACTIVE ||
      user.status === UserStatus.LOCKED
    ) {
      throw new AppError(
        ErrorCodes.ACCOUNT_INACTIVE,
        'Account is not active',
        403,
      );
    }

    const valid = await argon2.verify(
      user.credential.passwordHash,
      params.password,
    );
    if (!valid) {
      const failed = user.credential.failedAttempts + 1;
      await this.prisma.userCredential.update({
        where: { userId: user.id },
        data: {
          failedAttempts: failed,
          lockedUntil:
            failed >= MAX_FAILED
              ? new Date(Date.now() + LOCK_MINUTES * 60_000)
              : null,
        },
      });
      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid email or password',
        401,
      );
    }

    await this.prisma.userCredential.update({
      where: { userId: user.id },
      data: { failedAttempts: 0, lockedUntil: null },
    });

    const permissions = this.collectPermissions(user);
    const primaryRole = this.primaryRole(user);
    const refreshTtl = params.rememberMe
      ? '30d'
      : this.config.get<string>('JWT_REFRESH_TTL', '7d');
    const expiresAt = this.ttlToDate(refreshTtl);
    const refreshTokenRaw = randomBytes(48).toString('base64url');
    const refreshTokenHash = this.hashToken(refreshTokenRaw);

    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        channel: params.channel,
        refreshTokenHash,
        deviceName: params.deviceId,
        deviceLabel: params.deviceLabel,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
        expiresAt,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), status: UserStatus.ACTIVE },
    });

    const org = await this.getOrganization();
    const authUser = this.toAuthUser(user, primaryRole, permissions);
    const accessToken = await this.signAccessToken({
      sub: user.id,
      sid: session.id,
      role: primaryRole,
      channel: params.channel,
    });

    await this.audit.append({
      actorId: user.id,
      action: 'auth.login',
      module: 'auth',
      entityType: 'User',
      entityId: user.id,
      outcome: 'success',
      channel: params.channel,
      metadata: { sessionId: session.id },
    });

    return {
      session: {
        user: authUser,
        expiresAt: expiresAt.toISOString(),
        organization: org,
      },
      accessToken,
      refreshToken: refreshTokenRaw,
      refreshTokenRaw,
      sessionId: session.id,
    };
  }

  async refresh(params: {
    refreshToken: string;
    channel: AuthChannel;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<
    LoginResponseDto & { refreshTokenRaw: string; sessionId: string }
  > {
    const hash = this.hashToken(params.refreshToken);
    const session = await this.prisma.userSession.findFirst({
      where: { refreshTokenHash: hash },
      include: {
        user: {
          include: {
            department: true,
            roles: {
              include: {
                role: {
                  include: { permissions: { include: { permission: true } } },
                },
              },
            },
            permissionOverrides: { include: { permission: true } },
          },
        },
      },
    });

    if (!session || session.revokedAt) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid refresh token', 401);
    }

    if (session.expiresAt < new Date()) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Session expired', 401);
    }

    // Refresh reuse detection: if already rotated, revoke family
    if (session.replacedById) {
      await this.prisma.userSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppError(
        ErrorCodes.UNAUTHORIZED,
        'Refresh token reuse detected',
        401,
      );
    }

    const refreshTokenRaw = randomBytes(48).toString('base64url');
    const newSession = await this.prisma.userSession.create({
      data: {
        userId: session.userId,
        channel: params.channel,
        refreshTokenHash: this.hashToken(refreshTokenRaw),
        deviceName: session.deviceName,
        deviceLabel: session.deviceLabel,
        userAgent: params.userAgent ?? session.userAgent,
        ipAddress: params.ipAddress ?? session.ipAddress,
        expiresAt: session.expiresAt,
      },
    });

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), replacedById: newSession.id },
    });

    const permissions = this.collectPermissions(session.user);
    const primaryRole = this.primaryRole(session.user);
    const org = await this.getOrganization();
    const accessToken = await this.signAccessToken({
      sub: session.userId,
      sid: newSession.id,
      role: primaryRole,
      channel: params.channel,
    });

    return {
      session: {
        user: this.toAuthUser(session.user, primaryRole, permissions),
        expiresAt: newSession.expiresAt.toISOString(),
        organization: org,
      },
      accessToken,
      refreshToken: refreshTokenRaw,
      refreshTokenRaw,
      sessionId: newSession.id,
    };
  }

  async logout(sessionId: string, userId: string) {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.append({
      actorId: userId,
      action: 'auth.logout',
      module: 'auth',
      entityType: 'UserSession',
      entityId: sessionId,
      outcome: 'success',
    });
  }

  async getSession(userId: string, sessionId: string): Promise<SessionInfoDto> {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Session expired', 401);
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        department: true,
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
        permissionOverrides: { include: { permission: true } },
      },
    });

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { lastSeenAt: new Date() },
    });

    const permissions = this.collectPermissions(user);
    const primaryRole = this.primaryRole(user);
    const org = await this.getOrganization();
    return {
      user: this.toAuthUser(user, primaryRole, permissions),
      expiresAt: session.expiresAt.toISOString(),
      organization: org,
    };
  }

  async listSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        channel: true,
        deviceLabel: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async validateAccessPayload(payload: {
    sub: string;
    sid: string;
    role: SystemRole;
    channel: AuthChannel;
  }): Promise<AuthUserContext> {
    const session = await this.prisma.userSession.findFirst({
      where: { id: payload.sid, userId: payload.sub, revokedAt: null },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Session expired', 401);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
        permissionOverrides: { include: { permission: true } },
      },
    });
    if (
      !user ||
      user.status === UserStatus.INACTIVE ||
      user.status === UserStatus.LOCKED
    ) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'User inactive', 401);
    }

    return {
      id: user.id,
      email: user.email,
      role: payload.role,
      permissions: this.collectPermissions(user),
      sessionId: session.id,
      channel: payload.channel,
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    // Always succeed to avoid account enumeration
    if (!user) return { ok: true };

    const token = randomBytes(32).toString('base64url');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60_000),
      },
    });
    // In development, surface token via audit metadata only (not production emails yet)
    await this.audit.append({
      actorId: user.id,
      action: 'auth.forgot_password',
      module: 'auth',
      entityType: 'User',
      entityId: user.id,
      outcome: 'success',
      metadata: {
        resetTokenDevOnly:
          this.config.get('NODE_ENV') === 'development' ? token : undefined,
      },
    });
    return { ok: true };
  }

  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ) {
    if (password !== confirmPassword) {
      throw new AppError(ErrorCodes.VALIDATION, 'Passwords do not match', 400);
    }
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: this.hashToken(token),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!record) {
      throw new AppError(
        ErrorCodes.VALIDATION,
        'Invalid or expired reset token',
        400,
      );
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.userCredential.update({
        where: { userId: record.userId },
        data: { passwordHash, failedAttempts: 0, lockedUntil: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.userSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { mustChangePassword: false },
      }),
    ]);
    return { ok: true };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const cred = await this.prisma.userCredential.findUnique({
      where: { userId },
    });
    if (!cred || !(await argon2.verify(cred.passwordHash, currentPassword))) {
      throw new AppError(
        ErrorCodes.INVALID_CREDENTIALS,
        'Current password is incorrect',
        400,
      );
    }
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
    });
    await this.prisma.userCredential.update({
      where: { userId },
      data: { passwordHash, failedAttempts: 0, lockedUntil: null },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: false },
    });
    return { ok: true };
  }

  hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async signAccessToken(payload: {
    sub: string;
    sid: string;
    role: SystemRole;
    channel: AuthChannel;
  }) {
    const expiresIn = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    return this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      // nest/jwt expects ms.StringValue; config values are plain strings like "15m"
      expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  private ttlToDate(ttl: string): Date {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60_000);
    const n = Number(match[1]);
    const unit = match[2];
    const ms =
      unit === 's'
        ? n * 1000
        : unit === 'm'
          ? n * 60_000
          : unit === 'h'
            ? n * 3_600_000
            : n * 86_400_000;
    return new Date(Date.now() + ms);
  }

  private collectPermissions(user: {
    roles: Array<{
      role: { permissions: Array<{ permission: { code: string } }> };
    }>;
    permissionOverrides: Array<{
      granted: boolean;
      permission: { code: string };
    }>;
  }): string[] {
    const set = new Set<string>();
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) set.add(rp.permission.code);
    }
    for (const o of user.permissionOverrides) {
      if (o.granted) set.add(o.permission.code);
      else set.delete(o.permission.code);
    }
    return [...set].sort();
  }

  private primaryRole(user: {
    roles: Array<{ role: { code: string } }>;
  }): SystemRole {
    const order: SystemRole[] = [
      'owner',
      'tender_manager',
      'import_manager',
      'inventory_manager',
      'documentation_officer',
      'accounts_officer',
      'auditor',
    ];
    const codes = user.roles.map(
      (r) => r.role.code.toLowerCase() as SystemRole,
    );
    return order.find((r) => codes.includes(r)) ?? 'auditor';
  }

  private toAuthUser(
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      displayName: string;
      status: UserStatus;
      avatarUrl: string | null;
      lastLoginAt: Date | null;
      mustChangePassword: boolean;
      mfaEnabled: boolean;
      department?: { name: string } | null;
    },
    role: SystemRole,
    permissions: string[],
  ): AuthUserDto {
    const statusMap: Record<UserStatus, AuthUserDto['status']> = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      LOCKED: 'locked',
      PENDING: 'pending',
    };
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      role,
      roleLabel: ROLE_LABELS[role],
      department: user.department?.name,
      avatarUrl: user.avatarUrl,
      status: statusMap[user.status],
      permissions,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      mustChangePassword: user.mustChangePassword,
      mfaEnabled: user.mfaEnabled,
    };
  }

  private async getOrganization() {
    const org = await this.prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    return {
      id: org?.id ?? randomUUID(),
      name: org?.name ?? 'Saru International Pvt. Ltd.',
      shortName: org?.shortName ?? 'Saru',
    };
  }
}
