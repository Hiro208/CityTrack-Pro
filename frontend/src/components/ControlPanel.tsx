// src/components/ControlPanel.tsx
import React from 'react';
import { ROUTE_COLORS } from '../config/constants';
import type { FavoriteStop, NotificationItem, NotificationSettings, User } from '../types/transit';

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
  favoriteStops: FavoriteStop[];
  onToggleRouteFavorite: (routeId: string) => void;
  notificationCenter: NotificationItem[];
  notificationSettings: NotificationSettings | null;
  onToggleEmailNotifications: (enabled: boolean) => void;
  onTogglePushNotifications: (enabled: boolean) => void;
  onEnableBrowserPush: () => void;
  onMarkNotificationRead: (id: number) => void;
  onMarkAllNotificationsRead: () => void;
  unreadCount: number;
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
  favoriteStops,
  onToggleRouteFavorite,
  notificationCenter,
  notificationSettings,
  onToggleEmailNotifications,
  onTogglePushNotifications,
  onEnableBrowserPush,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  unreadCount,
}) => {
  return (
    <div className="absolute top-5 left-5 w-[22rem] max-h-[calc(100vh-2.5rem)] overflow-auto bg-neutral-900/90 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl z-10 text-white">
      <div className="mb-4 border-b border-white/10 pb-3">
        <h1 className="text-2xl font-black tracking-tighter m-0">Transit Console</h1>
        <p className="text-[10px] font-bold text-green-500 tracking-[0.25em] uppercase mt-1">NYC Real-Time Node</p>
      </div>

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
            title={!user ? 'Login required to favorite routes' : 'Favorite this route'}
          >
            ★
          </button>
        </div>
      </div>

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

      <div className="mt-4 p-3 rounded-xl bg-neutral-800/70 border border-neutral-700">
        {user ? (
          <div>
            <div className="text-xs text-green-300 font-semibold">Signed in as: {user.email}</div>
            <button
              type="button"
              onClick={onLogout}
              className="mt-2 w-full text-xs bg-neutral-700 hover:bg-neutral-600 transition rounded-lg py-2"
            >
              Sign out
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
                Login
              </button>
              <button
                type="button"
                onClick={() => onAuthModeChange('register')}
                className={`flex-1 py-1 rounded-r-lg ${authMode === 'register' ? 'bg-green-600' : 'bg-neutral-700'}`}
              >
                Register
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
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-neutral-800/70 border border-neutral-700">
        <div className="text-xs font-semibold text-gray-200 mb-2">Favorites</div>
        {user ? (
          <div className="space-y-2 text-[11px]">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Routes</div>
              <div className="flex flex-wrap gap-1">
                {Array.from(favoriteRoutes).length > 0 ? (
                  Array.from(favoriteRoutes).sort().map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-200 border border-yellow-500/30">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No favorite routes yet</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Stops</div>
              <div className="max-h-20 overflow-auto space-y-1">
                {favoriteStops.length > 0 ? (
                  favoriteStops.map((s) => (
                    <div key={s.stop_id} className="text-yellow-100/90">{s.stop_name || s.stop_id}</div>
                  ))
                ) : (
                  <div className="text-gray-500">No favorite stops yet</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-gray-400">Login to manage favorites</div>
        )}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-yellow-300">Notification Center</div>
          <div className="text-[10px] text-yellow-200/80">{unreadCount} unread</div>
        </div>
        {user ? (
          <>
            <div className="flex gap-2 mb-2">
              <label className="text-[10px] text-yellow-100/90 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!!notificationSettings?.email_notifications_enabled}
                  onChange={(e) => onToggleEmailNotifications(e.target.checked)}
                />
                Email
              </label>
              <label className="text-[10px] text-yellow-100/90 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!!notificationSettings?.push_notifications_enabled}
                  onChange={(e) => onTogglePushNotifications(e.target.checked)}
                />
                Push
              </label>
              <button
                type="button"
                onClick={onEnableBrowserPush}
                className="ml-auto text-[10px] px-2 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30"
              >
                Enable Browser Push
              </button>
            </div>
            <div className="mb-2">
              <button
                type="button"
                onClick={onMarkAllNotificationsRead}
                className="text-[10px] px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
              >
                Mark all as read
              </button>
            </div>
            {notificationCenter.length > 0 ? (
              <div className="max-h-48 overflow-auto space-y-2">
                {notificationCenter.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onMarkNotificationRead(n.id)}
                    className={`w-full text-left text-[10px] border-l-2 pl-2 py-1 ${
                      n.is_read
                        ? 'text-yellow-100/60 border-yellow-700 bg-yellow-500/5'
                        : 'text-yellow-100/95 border-yellow-400 bg-yellow-500/10'
                    }`}
                  >
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-yellow-200/70">{n.effect_text || 'UPDATE'}</div>
                    {n.body ? <div className="mt-0.5 line-clamp-2">{n.body}</div> : null}
                    <div className="mt-0.5 text-[9px] opacity-70">
                      {n.email_sent ? 'Email sent' : 'Email pending'} · {n.webpush_sent ? 'Push sent' : 'Push pending'}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-yellow-100/80">No notifications yet</div>
            )}
          </>
        ) : (
          <div className="text-[10px] text-yellow-100/80">Login to receive delay and service-change notifications</div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;