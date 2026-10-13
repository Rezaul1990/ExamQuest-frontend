export type UserRole = 'ADMIN' | 'STAFF' | 'MEMBER';
export type AccountStatus = 'active' | 'suspended' | 'invited' | 'pending_verification';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions?: string[];
  educationLevel?: 'SSC' | 'HSC';
  className?: string;
  group?: string;
  parent?: {
    name: string;
    phone: string;
    email?: string;
    relation: 'Father' | 'Mother' | 'Guardian';
  };
  emailVerified: boolean;
  accountStatus: AccountStatus;
  forcePasswordChange?: boolean;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};
