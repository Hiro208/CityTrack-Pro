// src/App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Map, { Source, Layer, NavigationControl, Popup, GeolocateControl } from 'react-map-gl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVehicles } from './hooks/useVehicles';
import ControlPanel from './components/ControlPanel';
import VehiclePopup from './components/VehiclePopup';
import type { ServiceAlert, User, Vehicle } from './types/transit';
import {
  addFavoriteRoute,
  addFavoriteStop,
  clearStoredToken,
  fetchFavorites,
  fetchMe,
  fetchMyNotifications,
  getStoredToken,
  login,
  register,
  removeFavoriteRoute,
  removeFavoriteStop,
  setStoredToken,
} from './api/transitApi';

// 引入 Mapbox 的默认样式表 (必须！)
import 'mapbox-gl/dist/mapbox-gl.css';

// 初始化 React Query 客户端
const queryClient = new QueryClient();
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN; // 从环境变量获取 Mapbox Token

const extractStopCode = (stopName?: string): string => {
  if (!stopName) return '';
  const match = stopName.match(/\(([A-Z0-9]+)\)\s*$/i);
  return match ? match[1].toUpperCase() : stopName.trim().toUpperCase();
};

//为了代码整洁，我们将地图逻辑拆分为一个子组件
const TransitMap = () => {
  const [selectedRoute, setSelectedRoute] = useState('ALL');
  const [hoverInfo, setHoverInfo] = useState<{ lng: number; lat: number; props: Vehicle } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [favoriteRoutes, setFavoriteRoutes] = useState<Set<string>>(new Set());
  const [favoriteStops, setFavoriteStops] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<ServiceAlert[]>([]);
  
  // 核心：调用我们要自定义 Hook 获取数据
  const { geoJSON, count, layerColorExpression } = useVehicles(selectedRoute);

  const refreshUserData = async () => {
    if (!getStoredToken()) return;
    const me = await fetchMe();
    if (!me) {
      clearStoredToken();
      setUser(null);
      setFavoriteRoutes(new Set());
      setFavoriteStops(new Set());
      setNotifications([]);
      return;
    }
    setUser(me);
    const fav = await fetchFavorites();
    setFavoriteRoutes(new Set(fav.routes.map((r) => r.route_id.toUpperCase())));
    setFavoriteStops(new Set(fav.stops.map((s) => s.stop_id.toUpperCase())));
    const myAlerts = await fetchMyNotifications();
    setNotifications(myAlerts);
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(async () => {
      const myAlerts = await fetchMyNotifications();
      setNotifications(myAlerts);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [user]);

  const handleSubmitAuth = async () => {
    try {
      if (!authForm.email || !authForm.password) return;
      const result = authMode === 'login'
        ? await login(authForm.email, authForm.password)
        : await register(authForm.email, authForm.password);
      setStoredToken(result.token);
      setUser(result.user);
      setAuthForm({ email: '', password: '' });
      await refreshUserData();
    } catch (e) {
      console.error('Auth failed:', e);
      alert(authMode === 'login' ? '登录失败，请检查账号密码' : '注册失败，可能邮箱已存在');
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    setFavoriteRoutes(new Set());
    setFavoriteStops(new Set());
    setNotifications([]);
  };

  const handleToggleRouteFavorite = async (routeId: string) => {
    if (!user) return;
    const key = routeId.toUpperCase();
    try {
      if (favoriteRoutes.has(key)) {
        await removeFavoriteRoute(key);
      } else {
        await addFavoriteRoute(key);
      }
      const fav = await fetchFavorites();
      setFavoriteRoutes(new Set(fav.routes.map((r) => r.route_id.toUpperCase())));
      setFavoriteStops(new Set(fav.stops.map((s) => s.stop_id.toUpperCase())));
      setNotifications(await fetchMyNotifications());
    } catch (e) {
      console.error('Toggle route favorite failed', e);
    }
  };

  const handleToggleStopFavorite = async (stopDisplayName: string) => {
    if (!user) return;
    const stopId = extractStopCode(stopDisplayName);
    if (!stopId) return;
    try {
      if (favoriteStops.has(stopId)) {
        await removeFavoriteStop(stopId);
      } else {
        await addFavoriteStop(stopId, stopDisplayName);
      }
      const fav = await fetchFavorites();
      setFavoriteRoutes(new Set(fav.routes.map((r) => r.route_id.toUpperCase())));
      setFavoriteStops(new Set(fav.stops.map((s) => s.stop_id.toUpperCase())));
      setNotifications(await fetchMyNotifications());
    } catch (e) {
      console.error('Toggle stop favorite failed', e);
    }
  };

  const hoveredStopId = useMemo(() => extractStopCode(hoverInfo?.props.stop_name), [hoverInfo]);

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <Map
        initialViewState={{ latitude: 40.73, longitude: -73.98, zoom: 11 }}
        mapStyle="mapbox://styles/mapbox/dark-v11" // 酷炫的深色模式
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={['transit-point']} // 指定哪些层可以交互
        onMouseMove={(e) => {
          // 鼠标悬停逻辑
          const feature = e.features?.[0];
          if (feature) {
            setHoverInfo({ 
              lng: e.lngLat.lng, 
              lat: e.lngLat.lat, 
              props: feature.properties as Vehicle 
            });
            e.target.getCanvas().style.cursor = 'pointer';
          } else {
            setHoverInfo(null);
            e.target.getCanvas().style.cursor = '';
          }
        }}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {/* 数据源：车辆 GeoJSON */}
        <Source id="vehicles-source" type="geojson" data={geoJSON}>
          {/* 图层 1: 光晕效果 (Glow) - 让点看起来在发光 */}
          <Layer
            id="transit-glow"
            type="circle"
            paint={{
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                8,
                20,
                10,
                27,
                12,
                34,
                14,
                38
              ],
              'circle-color': layerColorExpression as any, // 动态颜色
              'circle-opacity': 0.34,
              'circle-blur': 0.9
            }}
            beforeId="transit-point"
          />
          
          {/* 图层 2: 实体点 (Core) */}
          <Layer
            id="transit-point"
            type="circle"
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 7],
              'circle-color': layerColorExpression as any,
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 1
            }}
          />
        </Source>
        

        {/* 弹窗逻辑 */}
        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lng}
            latitude={hoverInfo.lat}
            closeButton={false}
            offset={15}
            maxWidth="320px"
            className="transit-popup" // 样式在 index.css 定义
          >
            <VehiclePopup
              info={hoverInfo}
              canFavoriteStop={!!user}
              isStopFavorited={hoveredStopId ? favoriteStops.has(hoveredStopId) : false}
              onToggleFavoriteStop={handleToggleStopFavorite}
            />
          </Popup>
        )}
      </Map>

      {/* 控制面板 */}
      <ControlPanel 
        selectedRoute={selectedRoute} 
        onSelectRoute={setSelectedRoute} 
        count={count}
        user={user}
        authMode={authMode}
        authForm={authForm}
        onAuthModeChange={setAuthMode}
        onAuthFormChange={setAuthForm}
        onSubmitAuth={handleSubmitAuth}
        onLogout={handleLogout}
        favoriteRoutes={favoriteRoutes}
        onToggleRouteFavorite={handleToggleRouteFavorite}
        notifications={notifications}
      />
    </div>
  );
};

// 主入口：包裹 QueryProvider
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TransitMap />
    </QueryClientProvider>
  );
}

export default App;