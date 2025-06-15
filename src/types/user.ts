export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  college: string;
  university: string;
  studyingYear: string;
  role: 'student' | 'admin';
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