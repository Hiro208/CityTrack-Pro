export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  created_at?: Date;
}

export interface AuthUser {
  id: number;
  email: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
}
