import { Response } from 'express';
import { FavoriteRepository } from '../repositories/favoriteRepository';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class FavoriteController {
  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const [routes, stops] = await Promise.all([
        FavoriteRepository.getFavoriteRoutes(userId),
        FavoriteRepository.getFavoriteStops(userId),
      ]);
      return res.json({ success: true, data: { routes, stops } });
    } catch (e) {
      return res.status(500).json({ success: false, message: '获取收藏失败' });
    }
  }

  static async addRoute(req: AuthenticatedRequest, res: Response) {
    try {
      const routeId = String(req.body.route_id || '').trim();
      if (!routeId) return res.status(400).json({ success: false, message: 'route_id 不能为空' });
      await FavoriteRepository.addFavoriteRoute(req.user!.id, routeId);
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: '收藏线路失败' });
    }
  }

  static async removeRoute(req: AuthenticatedRequest, res: Response) {
    try {
      const routeId = String(req.params.routeId || '').trim();
      if (!routeId) return res.status(400).json({ success: false, message: 'route_id 不能为空' });
      await FavoriteRepository.removeFavoriteRoute(req.user!.id, routeId);
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: '取消收藏线路失败' });
    }
  }

  static async addStop(req: AuthenticatedRequest, res: Response) {
    try {
      const stopId = String(req.body.stop_id || '').trim();
      const stopName = String(req.body.stop_name || '').trim();
      if (!stopId) return res.status(400).json({ success: false, message: 'stop_id 不能为空' });
      await FavoriteRepository.addFavoriteStop(req.user!.id, stopId, stopName || stopId);
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: '收藏站点失败' });
    }
  }

  static async removeStop(req: AuthenticatedRequest, res: Response) {
    try {
      const stopId = String(req.params.stopId || '').trim();
      if (!stopId) return res.status(400).json({ success: false, message: 'stop_id 不能为空' });
      await FavoriteRepository.removeFavoriteStop(req.user!.id, stopId);
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: '取消收藏站点失败' });
    }
  }
}
