// src/hooks/useVehicles.ts
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchVehicles } from '../api/transitApi';
import { ROUTE_COLORS } from '../config/constants';
import type { FeatureCollection, Point, GeoJsonProperties } from 'geojson';

// 1. 定义一个本地接口，严格描述后端返回的数据结构
// 包含了新字段 (lat, lon) 和旧字段 (latitude, longitude) 的并集
interface TransitVehicle {
  route_id: string;
  // 新后端字段 (Database Style)
  lat?: number | string;
  lon?: number | string;
  // 旧后端字段 (Legacy Style)
  latitude?: number | string;
  longitude?: number | string;
  // 允许对象包含其他未知属性 (用于 ...v 展开)
  [key: string]: unknown;
}

export const useVehicles = (selectedRoute: string) => {
  // 获取数据
  const { data: rawVehicles = [], error, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    refetchInterval: 3000,
    staleTime: 1000,
  });

  // 2. 数据转换：Raw Data -> GeoJSON
  const geoJSON = useMemo((): FeatureCollection<Point> => {
    // 强制将数据视为 TransitVehicle 类型数组
    const vehicles = rawVehicles as unknown as TransitVehicle[];

    const filtered = selectedRoute === 'ALL'
      ? vehicles
      : vehicles.filter(v => v.route_id === selectedRoute);

    return {
      type: 'FeatureCollection',
      features: filtered.map((v) => {
        // 优雅的取值逻辑：优先取 lat/lon，取不到则降级取 latitude/longitude，最后默认 0
        // 使用 ?? (空值合并) 而不是 ||，避免坐标 0 被误判
        const rawLat = v.lat ?? v.latitude ?? 0;
        const rawLon = v.lon ?? v.longitude ?? 0;

        // 确保转为数字类型
        const latitude = Number(rawLat);
        const longitude = Number(rawLon);

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            // Mapbox 格式: [经度, 纬度]
            coordinates: [longitude, latitude]
          },
          properties: {
            ...v,
            // 显式标准化字段，供弹窗 (Popup) 使用
            latitude,
            longitude,
          } as GeoJsonProperties // 确保符合 GeoJSON 标准类型
        };
      })
    };
  }, [rawVehicles, selectedRoute]);

  // 3. 构建 Mapbox 样式表达式
  // 使用 unknown[] 替代 any[]，保持类型系统的诚实性
  const layerColorExpression = useMemo(() => {
    const matchRules: unknown[] = ['match', ['get', 'route_id']];
    
    Object.entries(ROUTE_COLORS).forEach(([routeId, color]) => {
      matchRules.push(routeId, color);
    });
    
    matchRules.push('#808183'); // Fallback color
    return matchRules;
  }, []);

  return { 
    geoJSON, 
    vehicles: rawVehicles, 
    count: geoJSON.features.length,
    isLoading, 
    error, 
    layerColorExpression 
  };
};