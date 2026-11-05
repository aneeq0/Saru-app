export type SystemRole =
  | 'owner'
  | 'tender_manager'
  | 'import_manager'
  | 'inventory_manager'
  | 'documentation_officer'
  | 'accounts_officer'
  | 'auditor';

export interface AuthUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: SystemRole;
  roleLabel: string;
  department?: string;
  avatarUrl?: string | null;
  status: 'active' | 'inactive' | 'locked' | 'pending';
  permissions: string[];
  scopes?: Record<string, unknown>;
  lastLoginAt?: string | null;
  mustChangePassword?: boolean;
  mfaEnabled?: boolean;
}

export interface SessionInfoDto {
  user: AuthUserDto;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
    shortName: string;
  };
}

export interface LoginResponseDto {
  session: SessionInfoDto;
  accessToken?: string;
  refreshToken?: string;
  requiresMfa?: boolean;
  mfaChallengeId?: string;
}

export interface AuthUserContext {
  id: string;
  email: string;
  role: SystemRole;
  permissions: string[];
  sessionId: string;
  channel: 'WEB' | 'MOBILE' | 'API';
}

export const ROLE_LABELS: Record<SystemRole, string> = {
  owner: 'Owner / Super Administrator',
  tender_manager: 'Tender Manager',
  import_manager: 'Import Manager',
  inventory_manager: 'Inventory Manager',
  documentation_officer: 'Documentation / Sales Officer',
  accounts_officer: 'Accounts Officer',
  auditor: 'Read-Only / Auditor',
};
