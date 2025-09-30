// src/components/ControlPanel.tsx
import React from 'react';
import { ROUTE_COLORS } from '../config/constants';

interface Props {
  selectedRoute: string;
  onSelectRoute: (route: string) => void;
  count: number;
}

const ControlPanel: React.FC<Props> = ({ selectedRoute, onSelectRoute, count }) => {
  return (
    <div className="absolute top-5 left-5 w-72 bg-neutral-900/90 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl z-10 text-white">
      {/* 标题区 */}
      <div className="mb-4 border-b border-white/10 pb-3">
        <h1 className="text-2xl font-black tracking-tighter m-0">REPLICA</h1>
        <p className="text-[10px] font-bold text-green-500 tracking-[0.25em] uppercase mt-1">NYC Real-Time Node</p>
      </div>

      {/* 下拉选择框 */}
      <div className="relative group">
        <select 
          value={selectedRoute} 
          onChange={(e) => onSelectRoute(e.target.value)}
          className="w-full bg-neutral-800 text-white text-sm font-medium p-3 rounded-xl border border-neutral-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all appearance-none cursor-pointer hover:bg-neutral-750"
        >
          <option value="ALL">🔭 All Active Lines</option>
          {Object.keys(ROUTE_COLORS).map(route => (
            <option key={route} value={route}>
              {route} Line
            </option>
          ))}
        </select>
        {/* 自定义箭头 */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs transition-transform group-hover:translate-y-0">▼</div>
      </div>

      {/* 计数器 */}
      <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <div>
          <div className="text-3xl font-bold text-green-400 leading-none">
            {count}
          </div>
          <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide mt-1">
            Active Vehicles
          </div>
        </div>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>
    </div>
  );
};

export default ControlPanel;