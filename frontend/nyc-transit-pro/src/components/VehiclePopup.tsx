// src/components/VehiclePopup.tsx
import React from 'react';
import type { Vehicle } from '../types/transit';
import { ROUTE_COLORS, TERMINAL_MAP } from '../config/constants';
import { MapPin, Navigation } from 'lucide-react'; // 漂亮的图标库

interface Props {
  // 这里的 info 结构要匹配 react-map-gl 的事件返回
  info: { lng: number; lat: number; props: Vehicle };
}

const formatStatus = (status?: string): string => {
  const raw = (status || '').toUpperCase();
  const statusMap: Record<string, string> = {
    IN_TRANSIT_TO: 'In Transit',
    STOPPED_AT: 'Stopped At Station',
    INCOMING_AT: 'Arriving',
    '0': 'Arriving',
    '1': 'Stopped At Station',
    '2': 'In Transit',
  };
  return statusMap[raw] || status || 'Unknown';
};

const formatDirection = (direction?: string): string => {
  if (!direction) return 'Direction Unknown';
  if (direction === 'N') return 'Northbound';
  if (direction === 'S') return 'Southbound';
  if (direction === 'E') return 'Eastbound';
  if (direction === 'W') return 'Westbound';
  return direction;
};

const VehiclePopup: React.FC<Props> = ({ info }) => {
  const { props: v } = info;
  const color = ROUTE_COLORS[v.route_id] || '#808183';
  
  // 智能解析方向 (如果在字典里找不到，就用 N/S)
  const termData = TERMINAL_MAP[v.route_id]?.[v.direction];
  const directionText = termData?.dir || formatDirection(v.direction);
  
  // 优先显示 API 返回的 destination，如果没有则查字典
  const destinationText = v.destination || termData?.term || "Unknown Terminal";

  return (
    <div className="min-w-[240px] text-white">
      {/* 头部：线路 Logo 和状态 */}
      <div className="flex items-center justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-black shadow-lg border-2 border-white/20"
          style={{ backgroundColor: color }}
        >
          {v.route_id}
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-green-400 tracking-wider flex items-center justify-end gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            LIVE
          </div>
          <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">
            {directionText}
          </div>
        </div>
      </div>

      {/* 中部：终点站信息 */}
      <div className="mb-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase mb-1 font-semibold">
          <Navigation size={10} /> Bound For
        </div>
        <div className="text-lg font-bold leading-tight drop-shadow-md text-gray-100">
          {destinationText}
        </div>
      </div>

      {/* 底部：当前位置 */}
      <div className="bg-white/5 rounded-lg p-2 border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
          <MapPin size={10} /> Current Stop
        </div>
        <div className="text-sm font-semibold text-green-300">
          {v.stop_name || "In Transit"}
        </div>
        <div className="text-[9px] text-gray-500 mt-1 flex justify-between">
           <span>Status: {formatStatus(v.current_status)}</span>
           <span className="font-mono opacity-50">ID: {v.trip_id}</span>
        </div>
      </div>
    </div>
  );
};

export default VehiclePopup;