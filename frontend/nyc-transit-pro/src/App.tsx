// src/App.tsx
import React, { useState } from 'react';
import Map, { Source, Layer, NavigationControl, Popup, GeolocateControl } from 'react-map-gl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVehicles } from './hooks/useVehicles';
import ControlPanel from './components/ControlPanel';
import VehiclePopup from './components/VehiclePopup';
import type { Vehicle } from './types/transit';

// 引入 Mapbox 的默认样式表 (必须！)
import 'mapbox-gl/dist/mapbox-gl.css';

// 初始化 React Query 客户端
const queryClient = new QueryClient();
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN; // 从环境变量获取 Mapbox Token

//为了代码整洁，我们将地图逻辑拆分为一个子组件
const TransitMap = () => {
  const [selectedRoute, setSelectedRoute] = useState('ALL');
  const [hoverInfo, setHoverInfo] = useState<{ lng: number; lat: number; props: Vehicle } | null>(null);
  
  // 核心：调用我们要自定义 Hook 获取数据
  const { geoJSON, count, layerColorExpression } = useVehicles(selectedRoute);
  console.log("地图数据检查:", geoJSON);
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
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 8, 14, 20],
              'circle-color': layerColorExpression as any, // 动态颜色
              'circle-opacity': 0.4,
              'circle-blur': 0.5
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
            <VehiclePopup info={hoverInfo} />
          </Popup>
        )}
      </Map>

      {/* 控制面板 */}
      <ControlPanel 
        selectedRoute={selectedRoute} 
        onSelectRoute={setSelectedRoute} 
        count={count}
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