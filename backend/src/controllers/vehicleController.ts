import { Request, Response } from 'express';
import { VehicleRepository } from '../repositories/vehicleRepository';

export class VehicleController {
  /**
   * GET /api/vehicles
   * 获取所有活跃车辆
   */
  static async getAllVehicles(req: Request, res: Response) {
    try {
      const vehicles = await VehicleRepository.findAll();
      res.json({
        success: true,
        count: vehicles.length,
        data: vehicles
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '获取数据失败' });
    }
  }

  /**
   * GET /api/vehicles/insights
   * 返回时间窗趋势与对比指标
   */
  static async getVehicleInsights(req: Request, res: Response) {
    try {
      const route = typeof req.query.route === 'string' ? req.query.route : 'ALL';
      const range = typeof req.query.range === 'string' ? req.query.range : '1h';
      const compare = typeof req.query.compare === 'string' ? req.query.compare : 'previous';

      const insights = await VehicleRepository.getInsights({ route, range, compare });
      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '获取趋势数据失败' });
    }
  }
}