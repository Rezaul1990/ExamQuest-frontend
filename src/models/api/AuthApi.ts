import type { AuthUser } from '@/models/domain/Auth';

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: { path: string; message: string }[];
};

export type AuthResponseDto = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RegisterMemberRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  educationLevel: 'SSC' | 'HSC';
  className: string;
  group: 'Science' | 'Humanities' | 'BusinessStudies';
  academicYear: number;
  parent: {
    name: string;
    phone: string;
    email?: string;
    relation: 'Father' | 'Mother' | 'Guardian';
  };
};

export type RegisterMemberResponse = {
  user: AuthUser;
  message: string;
};

export type AcademicProfileRequest = Pick<RegisterMemberRequest, 'educationLevel' | 'className' | 'group' | 'academicYear'> & {
  confirmed: true; expectedRevision: number;
};
