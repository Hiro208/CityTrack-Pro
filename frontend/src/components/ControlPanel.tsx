// src/components/ControlPanel.tsx
import React from 'react';
import { ROUTE_COLORS } from '../config/constants';
import type { ServiceAlert, User } from '../types/transit';

interface Props {
  selectedRoute: string;
  onSelectRoute: (route: string) => void;
  count: number;
  user: User | null;
  authMode: 'login' | 'register';
  authForm: { email: string; password: string };
  onAuthModeChange: (mode: 'login' | 'register') => void;
  onAuthFormChange: (value: { email: string; password: string }) => void;
  onSubmitAuth: () => void;
  onLogout: () => void;
  favoriteRoutes: Set<string>;
  onToggleRouteFavorite: (routeId: string) => void;
  notifications: ServiceAlert[];
}

const ControlPanel: React.FC<Props> = ({
  selectedRoute,
  onSelectRoute,
  count,
  user,
  authMode,
  authForm,
  onAuthModeChange,
  onAuthFormChange,
  onSubmitAuth,
  onLogout,
  favoriteRoutes,
  onToggleRouteFavorite,
  notifications,
}) => {
  return (
    <div className="absolute top-5 left-5 w-72 bg-neutral-900/90 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl z-10 text-white">
      {/* 标题区 */}
      <div className="mb-4 border-b border-white/10 pb-3">
        <h1 className="text-2xl font-black tracking-tighter m-0">REPLICA</h1>
        <p className="text-[10px] font-bold text-green-500 tracking-[0.25em] uppercase mt-1">NYC Real-Time Node</p>
      </div>

      {/* 下拉选择框 */}
      <div className="relative group">
        <div className="flex gap-2">
          <select 
            value={selectedRoute} 
            onChange={(e) => onSelectRoute(e.target.value)}
            className="flex-1 bg-neutral-800 text-white text-sm font-medium p-3 rounded-xl border border-neutral-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all appearance-none cursor-pointer hover:bg-neutral-750"
          >
            <option value="ALL">🔭 All Active Lines</option>
            {Object.keys(ROUTE_COLORS).map(route => (
              <option key={route} value={route}>
                {route} Line
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!user || selectedRoute === 'ALL'}
            onClick={() => selectedRoute !== 'ALL' && onToggleRouteFavorite(selectedRoute)}
            className={`w-11 rounded-xl border text-lg transition ${
              selectedRoute !== 'ALL' && favoriteRoutes.has(selectedRoute)
                ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300'
                : 'bg-neutral-800 border-neutral-700 text-gray-400'
            } ${!user ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={!user ? '登录后可收藏线路' : '收藏当前线路'}
          >
            ★
          </button>
        </div>
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

      {/* 登录注册 */}
      <div className="mt-4 p-3 rounded-xl bg-neutral-800/70 border border-neutral-700">
        {user ? (
          <div>
            <div className="text-xs text-green-300 font-semibold">已登录: {user.email}</div>
            <button
              type="button"
              onClick={onLogout}
              className="mt-2 w-full text-xs bg-neutral-700 hover:bg-neutral-600 transition rounded-lg py-2"
            >
              退出登录
            </button>
          </div>
        ) : (
          <div>
            <div className="flex mb-2 text-xs">
              <button
                type="button"
                onClick={() => onAuthModeChange('login')}
                className={`flex-1 py-1 rounded-l-lg ${authMode === 'login' ? 'bg-green-600' : 'bg-neutral-700'}`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => onAuthModeChange('register')}
                className={`flex-1 py-1 rounded-r-lg ${authMode === 'register' ? 'bg-green-600' : 'bg-neutral-700'}`}
              >
                注册
              </button>
            </div>
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => onAuthFormChange({ ...authForm, email: e.target.value })}
              className="w-full mb-2 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs"
            />
            <input
              type="password"
              placeholder="Password (>=6)"
              value={authForm.password}
              onChange={(e) => onAuthFormChange({ ...authForm, password: e.target.value })}
              className="w-full mb-2 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={onSubmitAuth}
              className="w-full text-xs bg-green-600 hover:bg-green-500 transition rounded-lg py-2"
            >
              {authMode === 'login' ? '登录' : '注册'}
            </button>
          </div>
        )}
      </div>

      {/* 收藏提醒 */}
      <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <div className="text-xs font-semibold text-yellow-300 mb-2">服务变更 / 延误通知</div>
        {user ? (
          notifications.length > 0 ? (
            <div className="max-h-36 overflow-auto space-y-2">
              {notifications.slice(0, 5).map((a) => (
                <div key={a.id} className="text-[10px] text-yellow-100/90 border-l-2 border-yellow-400 pl-2">
                  <div className="font-semibold">{a.header_text || 'Service Alert'}</div>
                  <div className="text-yellow-200/70">{a.effect_text || 'UPDATE'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-yellow-100/80">暂无与你收藏线路/站点匹配的告警</div>
          )
        ) : (
          <div className="text-[10px] text-yellow-100/80">登录后可接收收藏线路/站点通知</div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;