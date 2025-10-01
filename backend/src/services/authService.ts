import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRepository } from '../repositories/userRepository';
import type { AuthUser, JwtPayload } from '../models/Auth';

export class AuthService {
  static async register(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserRepository.create(email, passwordHash);
    const token = this.signToken({ userId: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  }

  static async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('INVALID_CREDENTIALS');
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new Error('INVALID_CREDENTIALS');
    const token = this.signToken({ userId: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  }

  static verifyToken(token: string): JwtPayload {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return payload;
  }

  private static signToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }
}
