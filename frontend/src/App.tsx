// src/App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Map, { Source, Layer, NavigationControl, Popup, GeolocateControl } from 'react-map-gl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVehicles } from './hooks/useVehicles';
import ControlPanel from './components/ControlPanel';
import VehiclePopup from './components/VehiclePopup';
import type { FavoriteStop, NotificationItem, NotificationSettings, User, Vehicle } from './types/transit';
import {
  addFavoriteRoute,
  addFavoriteStop,
  clearStoredToken,
  fetchFavorites,
  fetchMe,
  fetchNotificationCenter,
  fetchNotificationSettings,
  fetchPushConfig,
  getStoredToken,
  login,
  markAllNotificationsRead,
  markNotificationRead,
  register,
  removeFavoriteRoute,
  removeFavoriteStop,
  subscribePush,
  setStoredToken,
  updateNotificationSettings,
} from './api/transitApi';

import 'mapbox-gl/dist/mapbox-gl.css';

const queryClient = new QueryClient();
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const extractStopCode = (stopName?: string): string => {
  if (!stopName) return '';
  const match = stopName.match(/\(([A-Z0-9]+)\)\s*$/i);
  return match ? match[1].toUpperCase() : stopName.trim().toUpperCase();
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
};

type PopupInfo = { lng: number; lat: number; props: Vehicle };

const TransitMap = () => {
  const [selectedRoute, setSelectedRoute] = useState('ALL');
  const [hoverInfo, setHoverInfo] = useState<PopupInfo | null>(null);
  const [pinnedInfo, setPinnedInfo] = useState<PopupInfo | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [favoriteRoutes, setFavoriteRoutes] = useState<Set<string>>(new Set());
  const [favoriteStops, setFavoriteStops] = useState<FavoriteStop[]>([]);
  const [favoriteStopSet, setFavoriteStopSet] = useState<Set<string>>(new Set());
  const [notificationCenter, setNotificationCenter] = useState<NotificationItem[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [authError, setAuthError] = useState('');
  
  const { geoJSON, count, layerColorExpression } = useVehicles(selectedRoute);

  const unreadCount = useMemo(
    () => notificationCenter.filter((n) => !n.is_read).length,
    [notificationCenter]
  );

  const refreshUserData = async () => {
    if (!getStoredToken()) return;
    const me = await fetchMe();
    if (!me) {
      clearStoredToken();
      setUser(null);
      setFavoriteRoutes(new Set());
      setFavoriteStops([]);
      setFavoriteStopSet(new Set());
      setNotificationCenter([]);
      setNotificationSettings(null);
      return;
    }
    setUser(me);
    const fav = await fetchFavorites();
    setFavoriteRoutes(new Set(fav.routes.map((r) => r.route_id.toUpperCase())));
    setFavoriteStops(fav.stops);
    setFavoriteStopSet(new Set(fav.stops.map((s) => s.stop_id.toUpperCase())));
    setNotificationCenter(await fetchNotificationCenter());
    setNotificationSettings(await fetchNotificationSettings());
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(async () => {
      setNotificationCenter(await fetchNotificationCenter());
    }, 30000);
    return () => window.clearInterval(timer);
  }, [user]);

  const handleSubmitAuth = async () => {
    try {
      setAuthError('');
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
      setAuthError(authMode === 'login' ? 'Login failed. Check your email/password.' : 'Registration failed. Email may already exist.');
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    setFavoriteRoutes(new Set());
    setFavoriteStops([]);
    setFavoriteStopSet(new Set());
    setNotificationCenter([]);
    setNotificationSettings(null);
    setAuthError('');
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
      setFavoriteStops(fav.stops);
      setFavoriteStopSet(new Set(fav.stops.map((s) => s.stop_id.toUpperCase())));
      setNotificationCenter(await fetchNotificationCenter());
    } catch (e) {
      console.error('Toggle route favorite failed', e);
    }
  };

  const handleToggleStopFavorite = async (stopDisplayName: string) => {
    if (!user) return;
    const stopId = extractStopCode(stopDisplayName);
    if (!stopId) return;
    const wasFavorited = favoriteStopSet.has(stopId);
    const optimisticSet = new Set(favoriteStopSet);
    if (wasFavorited) optimisticSet.delete(stopId);
    else optimisticSet.add(stopId);
    setFavoriteStopSet(optimisticSet);

    try {
      if (wasFavorited) {
        await removeFavoriteStop(stopId);
      } else {
        await addFavoriteStop(stopId, stopDisplayName);
      }
      const fav = await fetchFavorites();
      setFavoriteRoutes(new Set(fav.routes.map((r) => r.route_id.toUpperCase())));
      setFavoriteStops(fav.stops);
      setFavoriteStopSet(new Set(fav.stops.map((s) => s.stop_id.toUpperCase())));
      setNotificationCenter(await fetchNotificationCenter());
    } catch (e) {
      console.error('Toggle stop favorite failed', e);
      // rollback optimistic update
      setFavoriteStopSet(new Set(favoriteStopSet));
    }
  };

  const handleEnableBrowserPush = async () => {
    if (!user) return;
    try {
      const config = await fetchPushConfig();
      if (!config.enabled || !config.publicKey) {
        alert('Push is not configured on server yet.');
        return;
      }
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        alert('This browser does not support Push Notifications.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied.');
        return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js');
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey),
        }));
      await subscribePush(subscription as unknown as PushSubscription);
      alert('Browser Push enabled.');
    } catch (e) {
      console.error('Enable push failed', e);
      alert('Failed to enable browser push.');
    }
  };

  const activePopup = pinnedInfo ?? hoverInfo;
  const activeStopId = useMemo(() => extractStopCode(activePopup?.props.stop_name), [activePopup]);

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <Map
        initialViewState={{ latitude: 40.73, longitude: -73.98, zoom: 11 }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={['transit-point']}
        onMouseMove={(e) => {
          if (pinnedInfo) return;
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
        onClick={(e) => {
          const target = e.originalEvent?.target as HTMLElement | null;
          if (target?.closest('.mapboxgl-popup')) return;
          const feature = e.features?.[0];
          if (feature) {
            const popupData = {
              lng: e.lngLat.lng,
              lat: e.lngLat.lat,
              props: feature.properties as Vehicle,
            };
            setPinnedInfo(popupData);
            setHoverInfo(popupData);
          } else {
            setPinnedInfo(null);
            setHoverInfo(null);
          }
        }}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        <Source id="vehicles-source" type="geojson" data={geoJSON}>
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
              'circle-color': layerColorExpression as any,
              'circle-opacity': 0.34,
              'circle-blur': 0.9
            }}
            beforeId="transit-point"
          />
          
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
        
        {activePopup && (
          <Popup
            longitude={activePopup.lng}
            latitude={activePopup.lat}
            closeButton={!!pinnedInfo}
            closeOnClick={false}
            offset={15}
            maxWidth="320px"
            className="transit-popup"
            onClose={() => setPinnedInfo(null)}
          >
            <VehiclePopup
              info={activePopup}
              canFavoriteStop={!!user}
              isStopFavorited={activeStopId ? favoriteStopSet.has(activeStopId) : false}
              onToggleFavoriteStop={handleToggleStopFavorite}
              onPinPopup={() => {
                if (!pinnedInfo && activePopup) setPinnedInfo(activePopup);
              }}
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
        favoriteStops={favoriteStops}
        onToggleRouteFavorite={handleToggleRouteFavorite}
        notificationCenter={notificationCenter}
        notificationSettings={notificationSettings}
        onToggleEmailNotifications={(enabled) =>
          updateNotificationSettings({ email_notifications_enabled: enabled }).then(setNotificationSettings)
        }
        onTogglePushNotifications={(enabled) =>
          updateNotificationSettings({ push_notifications_enabled: enabled }).then(setNotificationSettings)
        }
        onEnableBrowserPush={handleEnableBrowserPush}
        onMarkNotificationRead={async (id) => {
          await markNotificationRead(id);
          setNotificationCenter(await fetchNotificationCenter());
        }}
        onMarkAllNotificationsRead={async () => {
          await markAllNotificationsRead();
          setNotificationCenter(await fetchNotificationCenter());
        }}
        unreadCount={unreadCount}
      />
      {authError ? (
        <div className="absolute bottom-5 left-5 z-20 px-3 py-2 rounded-lg bg-red-600/90 text-white text-xs shadow-lg">
          {authError}
        </div>
      ) : null}
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TransitMap />
    </QueryClientProvider>
  );
}

export default App;