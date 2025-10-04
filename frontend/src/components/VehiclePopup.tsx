// src/components/VehiclePopup.tsx
import React from 'react';
import type { Vehicle } from '../types/transit';
import { ROUTE_COLORS, TERMINAL_MAP } from '../config/constants';
import { MapPin, Navigation } from 'lucide-react';

interface Props {
  info: { lng: number; lat: number; props: Vehicle };
  canFavoriteStop?: boolean;
  isStopFavorited?: boolean;
  onToggleFavoriteStop?: (stopName: string) => void;
  onPinPopup?: () => void;
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

const extractStopCode = (stopName?: string): string => {
  if (!stopName) return '';
  const match = stopName.match(/\(([A-Z0-9]+)\)\s*$/i);
  return match ? match[1].toUpperCase() : stopName.trim().toUpperCase();
};

const VehiclePopup: React.FC<Props> = ({
  info,
  canFavoriteStop,
  isStopFavorited,
  onToggleFavoriteStop,
  onPinPopup,
}) => {
  const { props: v } = info;
  const color = ROUTE_COLORS[v.route_id] || '#808183';
  
  const termData = TERMINAL_MAP[v.route_id]?.[v.direction];
  const directionText = termData?.dir || formatDirection(v.direction);
  
  const destinationText = v.destination || termData?.term || "Unknown Terminal";

  return (
    <div
      className="min-w-[240px] text-white"
      onMouseDown={() => onPinPopup?.()}
      onMouseEnter={() => onPinPopup?.()}
    >
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

      <div className="mb-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase mb-1 font-semibold">
          <Navigation size={10} /> Bound For
        </div>
        <div className="text-lg font-bold leading-tight drop-shadow-md text-gray-100">
          {destinationText}
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-2 border border-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-1 text-[10px] text-gray-400 mb-1">
          <div className="flex items-center gap-1">
          <MapPin size={10} /> Current Stop
          </div>
          <button
            type="button"
            disabled={!canFavoriteStop || !v.stop_name}
            onClick={() => v.stop_name && onToggleFavoriteStop?.(v.stop_name)}
            className={`text-sm leading-none ${
              isStopFavorited ? 'text-yellow-300' : 'text-gray-500'
            } ${!canFavoriteStop ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={!canFavoriteStop ? 'Login required to favorite stops' : `Favorite stop ${extractStopCode(v.stop_name)}`}
          >
            ★
          </button>
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