// src/components/VehiclePopup.tsx
import React from 'react';
import type { Vehicle } from '../types/transit';
import { ROUTE_COLORS, TERMINAL_MAP } from '../config/constants';
import { MapPin, Navigation } from 'lucide-react';
import type { TranslateFn } from '../i18n';

interface Props {
  info: { lng: number; lat: number; props: Vehicle };
  t: TranslateFn;
  canFavoriteStop?: boolean;
  isStopFavorited?: boolean;
  onToggleFavoriteStop?: (stopName: string) => void;
  onPinPopup?: () => void;
}

const formatStatus = (status: string | undefined, t: TranslateFn): string => {
  const raw = (status || '').toUpperCase();
  const statusMap: Record<string, string> = {
    IN_TRANSIT_TO: t('inTransit'),
    STOPPED_AT: t('stoppedAtStation'),
    INCOMING_AT: t('arriving'),
    '0': t('arriving'),
    '1': t('stoppedAtStation'),
    '2': t('inTransit'),
  };
  return statusMap[raw] || status || t('unknown');
};

const formatDirection = (direction: string | undefined, t: TranslateFn): string => {
  if (!direction) return t('directionUnknown');
  if (direction === 'N') return t('northbound');
  if (direction === 'S') return t('southbound');
  if (direction === 'E') return t('eastbound');
  if (direction === 'W') return t('westbound');
  return direction;
};

const extractStopCode = (stopName?: string): string => {
  if (!stopName) return '';
  const match = stopName.match(/\(([A-Z0-9]+)\)\s*$/i);
  return match ? match[1].toUpperCase() : stopName.trim().toUpperCase();
};

const VehiclePopup: React.FC<Props> = ({
  info,
  t,
  canFavoriteStop,
  isStopFavorited,
  onToggleFavoriteStop,
  onPinPopup,
}) => {
  const { props: v } = info;
  const color = ROUTE_COLORS[v.route_id] || '#808183';
  
  const termData = TERMINAL_MAP[v.route_id]?.[v.direction];
  const directionText = termData?.dir || formatDirection(v.direction, t);
  
  const destinationText = v.destination || termData?.term || t('unknownTerminal');

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
            {t('live')}
          </div>
          <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">
            {directionText}
          </div>
        </div>
      </div>

      <div className="mb-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase mb-1 font-semibold">
          <Navigation size={10} /> {t('boundFor')}
        </div>
        <div className="text-lg font-bold leading-tight drop-shadow-md text-gray-100">
          {destinationText}
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-2 border border-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-1 text-[10px] text-gray-400 mb-1">
          <div className="flex items-center gap-1">
          <MapPin size={10} /> {t('currentStop')}
          </div>
          <button
            type="button"
            disabled={!canFavoriteStop || !v.stop_name}
            onClick={() => v.stop_name && onToggleFavoriteStop?.(v.stop_name)}
            className={`text-sm leading-none ${
              isStopFavorited ? 'text-yellow-300' : 'text-gray-500'
            } ${!canFavoriteStop ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={!canFavoriteStop ? t('loginRequiredStop') : `${t('favoriteStop')} ${extractStopCode(v.stop_name)}`}
          >
            ★
          </button>
        </div>
        <div className="text-sm font-semibold text-green-300">
          {v.stop_name || t('inTransit')}
        </div>
        <div className="text-[9px] text-gray-500 mt-1 flex justify-between">
           <span>{t('status')}: {formatStatus(v.current_status, t)}</span>
           <span className="font-mono opacity-50">ID: {v.trip_id}</span>
        </div>
      </div>
    </div>
  );
};

export default VehiclePopup;