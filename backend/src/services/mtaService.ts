import axios from 'axios';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { env } from '../config/env';
import { FEED_URLS, TERMINAL_MAP } from '../config/constants';
import { VehicleRepository } from '../repositories/vehicleRepository';

export class MtaService {
  
  /**
   * 主入口：抓取所有线路并保存
   */
  static async fetchAndSaveAllFeeds() {
    console.log('🔄 开始新一轮数据抓取...');
    const startTime = Date.now();

    // 并行抓取所有 URL
    const promises = FEED_URLS.map(url => this.fetchSingleFeed(url));
    const results = await Promise.allSettled(promises);

    // 汇总数据
    let allVehicles: any[] = [];
    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        allVehicles = allVehicles.concat(res.value);
      } else {
        console.error(`❌ Feed ${index} 抓取失败:`, res.reason);
      }
    });

    // 存入数据库
    if (allVehicles.length > 0) {
      await VehicleRepository.saveBatch(allVehicles);
    }
    
    //清理旧数据 
    await VehicleRepository.pruneOldData();

    console.log(`✅ 完成！共处理 ${allVehicles.length} 辆车，耗时 ${Date.now() - startTime}ms`);
  }

  /**
   * 抓取单个 Feed URL
   */
  // src/services/mtaService.ts

private static async fetchSingleFeed(url: string) {
  try {
    
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    
      headers: { 
        'Accept': 'application/x-protobuf' 
      },
      timeout: 10000
    });

    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(response.data)
    );

    const vehicles = [];
    for (const entity of feed.entity) {
      if (entity.vehicle && entity.vehicle.trip) {
        const parsed = this.parseVehicle(entity.vehicle);
        if (parsed) vehicles.push(parsed);
      }
    }
    return vehicles;

  } catch (error: any) {
    console.error(`\n--- 🕵️ 抓取诊断报告 [${url.slice(-10)}] ---`);
    if (error.response) {
      console.error(`🚫 状态码: ${error.response.status}`);
      console.error(`🚫 错误信息: ${error.response.statusText}`);
    } else {
      console.error(`❗ 网络或系统错误: ${error.message}`);
    }
    return []; 
  }
}

  private static parseVehicle(vehicle: any) {
    try {
      const tripId = vehicle.trip.tripId;
      const routeId = vehicle.trip.routeId;
      const stopId = vehicle.stopId || ''; 
      
      // 解析方向 (N 或 S)
      const directionChar = stopId.length > 0 ? stopId.slice(-1) : ''; 
      
      // 查字典
      const routeInfo = TERMINAL_MAP[routeId];
      let direction = 'Unknown';
      let destination = 'Unknown';

      if (routeInfo && (directionChar === 'N' || directionChar === 'S')) {
        // @ts-ignore: 忽略类型检查
        const info = routeInfo[directionChar];
        if (info) {
          direction = info.dir;
          destination = info.term;
        }
      }

      // 返回符合数据库结构的对象
      return {
        trip_id: tripId,
        route_id: routeId,
        lat: vehicle.position?.latitude || 0,
        lon: vehicle.position?.longitude || 0,
        timestamp: vehicle.timestamp ? Number(vehicle.timestamp) : Math.floor(Date.now() / 1000),
        stop_name: stopId, 
        current_status: vehicle.currentStatus, 
        direction: direction,
        destination: destination,
        consist: '' 
      };
    } catch (e) {
      return null; 
    }
  }
}