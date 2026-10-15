export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  college: string;
  university: string;
  studyingYear: string;
  role: 'student' | 'admin';
  emailVerified?: boolean;
  isFoundingMember?: boolean;
  adFree?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  college: string;
  university: string;
  studyingYear: string;
} 