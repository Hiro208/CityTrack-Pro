import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/authService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, message: '未授权' });

  try {
    const payload = AuthService.verifyToken(token);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token 无效或已过期' });
  }
};
