import axios from 'axios';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import * as path from 'path';
import * as fs from 'fs';
import { FEED_URLS, TERMINAL_MAP } from '../config/constants';
import { VehicleRepository } from '../repositories/vehicleRepository';
import redisClient from '../config/redis';

// 加载站点坐标 (stop_id -> { lat, lon })
let STOPS_MAP: Record<string, { lat: number; lon: number; name?: string }> = {};
const STOPS_PATH = path.join(__dirname, '../data/stops.json');

function loadStops() {
  if (Object.keys(STOPS_MAP).length > 0) return;
  try {
    if (fs.existsSync(STOPS_PATH)) {
      STOPS_MAP = JSON.parse(fs.readFileSync(STOPS_PATH, 'utf-8'));
      console.log(`📍 已加载 ${Object.keys(STOPS_MAP).length} 个站点坐标`);
    }
  } catch (e) {
    console.warn('⚠️ 无法加载 stops.json，将仅使用 VehiclePosition 的坐标');
  }
}

function getStopCoords(stopId: string): { lat: number; lon: number } | null {
  if (!stopId) return null;
  const s = STOPS_MAP[stopId] || STOPS_MAP[stopId.replace(/[NS]$/, '')];
  if (s && s.lat && s.lon) return { lat: s.lat, lon: s.lon };
  return null;
}

function getStopDisplayName(stopId: string): string {
  if (!stopId) return 'Unknown Stop';
  const s = STOPS_MAP[stopId] || STOPS_MAP[stopId.replace(/[NS]$/, '')];
  if (!s?.name) return stopId;
  return `${s.name} (${stopId})`;
}

export class MtaService {
  /**
   * 主入口：抓取所有线路并保存
   */
  static async fetchAndSaveAllFeeds() {
    loadStops();
    console.log('🔄 开始新一轮数据抓取...');
    const startTime = Date.now();

    const promises = FEED_URLS.map(url => this.fetchSingleFeed(url));
    const results = await Promise.allSettled(promises);

    let allVehicles: any[] = [];
    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        allVehicles = allVehicles.concat(res.value);
      } else {
        console.error(`❌ Feed ${index} 抓取失败:`, res.reason);
      }
    });

    if (allVehicles.length > 0) {
      await VehicleRepository.saveBatch(allVehicles);
      await redisClient.set('vehicles:all', JSON.stringify(allVehicles), { EX: 60 });
    }

    await VehicleRepository.pruneOldData();
    console.log(`✅ 完成！共处理 ${allVehicles.length} 辆车，耗时 ${Date.now() - startTime}ms`);
  }

  /**
   * 抓取单个 Feed URL
   * MTA 地铁 feed 不需要 API key，直接访问 URL 即可
   */
  private static async fetchSingleFeed(url: string) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { Accept: 'application/x-protobuf' },
        timeout: 10000
      });

      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(response.data)
      );

      const vehicles: any[] = [];
      const seenTripIds = new Set<string>();

      for (const entity of feed.entity) {
        // 1. 处理 VehiclePosition（若有 position 则优先使用）
        if (entity.vehicle && entity.vehicle.trip) {
          const parsed = this.parseVehicle(entity.vehicle);
          if (parsed && (parsed.lat !== 0 || parsed.lon !== 0) && !seenTripIds.has(parsed.trip_id)) {
            seenTripIds.add(parsed.trip_id);
            vehicles.push(parsed);
          }
        }
        // 2. 处理 TripUpdate（地铁主要数据源，从 stop 推断位置）
        if (entity.tripUpdate && entity.tripUpdate.trip) {
          const parsed = this.parseTripUpdate(entity.tripUpdate);
          if (parsed && parsed.length > 0) {
            for (const p of parsed) {
              if (!seenTripIds.has(p.trip_id)) {
                seenTripIds.add(p.trip_id);
                vehicles.push(p);
              }
            }
          }
        }
      }

      return vehicles;
    } catch (error: any) {
      console.error(`\n--- 🕵️ 抓取诊断报告 [${url.slice(-20)}] ---`);
      if (error.response) {
        console.error(`🚫 状态码: ${error.response.status}`);
        console.error(`🚫 错误信息: ${error.response.statusText}`);
      } else {
        console.error(`❗ 网络或系统错误: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * 解析 VehiclePosition 实体
   */
  private static parseVehicle(vehicle: any) {
    try {
      const tripId = vehicle.trip?.tripId || '';
      const routeId = vehicle.trip?.routeId || '';
      const stopId = vehicle.stopId || '';

      let lat = 0;
      let lon = 0;
      if (vehicle.position) {
        lat = Number(vehicle.position.latitude) || 0;
        lon = Number(vehicle.position.longitude) || 0;
      }
      if (lat === 0 && lon === 0 && stopId) {
        const coords = getStopCoords(stopId);
        if (coords) {
          lat = coords.lat;
          lon = coords.lon;
        }
      }

      const directionChar = stopId.length > 0 ? stopId.slice(-1) : '';
      const routeInfo = TERMINAL_MAP[routeId];
      let direction = directionChar || 'Unknown';
      let destination = 'Unknown';
      if (routeInfo && (directionChar === 'N' || directionChar === 'S')) {
        const info = (routeInfo as any)[directionChar];
        if (info) {
          destination = info.term;
        }
      }

      const timestamp = vehicle.timestamp != null ? Number(vehicle.timestamp) : Math.floor(Date.now() / 1000);
      const currentStatus = vehicle.currentStatus != null ? String(vehicle.currentStatus) : '';

      return {
        trip_id: tripId,
        route_id: routeId,
        lat,
        lon,
        timestamp,
        stop_name: getStopDisplayName(stopId),
        current_status: currentStatus,
        direction,
        destination,
        consist: ''
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * 解析 TripUpdate 实体，从 stopTimeUpdate 推断车辆位置
   * MTA 地铁 feed 主要提供 TripUpdate，不提供 VehiclePosition 的经纬度
   */
  private static parseTripUpdate(tripUpdate: any): any[] {
    const results: any[] = [];
    try {
      const trip = tripUpdate.trip;
      const tripId = trip?.tripId || '';
      const routeId = trip?.routeId || '';
      if (!tripId || !routeId) return results;

      const stopTimeUpdates = tripUpdate.stopTimeUpdate || [];
      if (stopTimeUpdates.length === 0) return results;

      let timestamp = tripUpdate.timestamp != null ? Number(tripUpdate.timestamp) : 0;
      if (!timestamp) timestamp = Math.floor(Date.now() / 1000);

      for (const stu of stopTimeUpdates) {
        const stopId = stu.stopId || '';
        if (!stopId) continue;

        const coords = getStopCoords(stopId);
        if (!coords) continue;

        const directionChar = stopId.slice(-1);
        const routeInfo = TERMINAL_MAP[routeId];
        let direction = directionChar || 'Unknown';
        let destination = 'Unknown';
        if (routeInfo && (directionChar === 'N' || directionChar === 'S')) {
          const info = (routeInfo as any)[directionChar];
          if (info) {
            destination = info.term;
          }
        }

        results.push({
          trip_id: tripId,
          route_id: routeId,
          lat: coords.lat,
          lon: coords.lon,
          timestamp,
          stop_name: getStopDisplayName(stopId),
          current_status: 'IN_TRANSIT_TO',
          direction,
          destination,
          consist: ''
        });
        break;
      }
    } catch (e) {
      // ignore
    }
    return results;
  }
}
