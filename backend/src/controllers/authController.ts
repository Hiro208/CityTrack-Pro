import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { UserRepository } from '../repositories/userRepository';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const email = String(req.body.email || '').trim();
      const password = String(req.body.password || '');
      if (!email || !password || password.length < 6) {
        return res.status(400).json({ success: false, message: '邮箱和密码不能为空，且密码至少6位' });
      }
      const result = await AuthService.register(email, password);
      return res.json({ success: true, ...result });
    } catch (e: any) {
      if (e.message === 'EMAIL_EXISTS') {
        return res.status(409).json({ success: false, message: '邮箱已注册' });
      }
      return res.status(500).json({ success: false, message: '注册失败' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const email = String(req.body.email || '').trim();
      const password = String(req.body.password || '');
      if (!email || !password) {
        return res.status(400).json({ success: false, message: '邮箱和密码不能为空' });
      }
      const result = await AuthService.login(email, password);
      return res.json({ success: true, ...result });
    } catch (e: any) {
      if (e.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({ success: false, message: '邮箱或密码错误' });
      }
      return res.status(500).json({ success: false, message: '登录失败' });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: '未授权' });
      const user = await UserRepository.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
      return res.json({ success: true, user: { id: user.id, email: user.email } });
    } catch (e) {
      return res.status(500).json({ success: false, message: '获取用户信息失败' });
    }
  }
}
