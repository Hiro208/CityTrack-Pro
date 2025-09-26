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
}