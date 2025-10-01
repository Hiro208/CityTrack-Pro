import { Request, Response } from 'express';
import { AlertRepository } from '../repositories/alertRepository';
import { FavoriteRepository } from '../repositories/favoriteRepository';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class AlertController {
  static async list(req: Request, res: Response) {
    try {
      const alerts = await AlertRepository.getRecent(100);
      return res.json({ success: true, count: alerts.length, data: alerts });
    } catch (e) {
      return res.status(500).json({ success: false, message: '获取服务告警失败' });
    }
  }

  static async myNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const [routes, stops] = await Promise.all([
        FavoriteRepository.getFavoriteRoutes(userId),
        FavoriteRepository.getFavoriteStops(userId),
      ]);
      const routeIds = routes.map((r) => r.route_id.toUpperCase());
      const stopIds = stops.map((s) => s.stop_id.toUpperCase());
      const alerts = await AlertRepository.getForFavorites(routeIds, stopIds, 100);
      return res.json({
        success: true,
        count: alerts.length,
        favorites: { routeIds, stopIds },
        data: alerts,
      });
    } catch (e) {
      return res.status(500).json({ success: false, message: '获取个人通知失败' });
    }
  }
}
