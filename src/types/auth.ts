export type RegisterBody = {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  username: string;
  cover?: string;
  categories?: Array<{ name: string }>;
  languages?: string[];
};

export type LoginBody = {
  email: string;
  password: string;
};

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  birthdate: string;
  bio: string | null;
  coins: number;
  avatar: string | null;
  cover: string | null;
  resetToken: string | null;
  resetTokenExp: string | null;
  emailVerified: boolean;
  emailVerificationCode: string | null;
  emailVerificationExp: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
