// src/types/transit.ts

export interface Vehicle {
  trip_id: string;
  route_id: string;
  /** 后端返回 lat/lon，前端兼容 latitude/longitude */
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  direction: string; // "N", "S", "E", "W"
  destination: string;
  stop_name: string;
  current_status: string; // "IN_TRANSIT_TO", "STOPPED_AT", etc.
  timestamp: number;
}

// 终点站字典的结构定义
export interface TerminalInfo {
  term: string; // 终点站名称
  dir: string;  // 方向描述 (e.g., "Uptown", "Queens-bound")
}

export type TerminalMapType = {
  [key: string]: {
    N?: TerminalInfo;
    S?: TerminalInfo;
    [key: string]: TerminalInfo | undefined; // 兼容可能的其他方向代码
  };
};