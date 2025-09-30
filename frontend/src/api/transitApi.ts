// src/api/transitApi.ts
import axios from 'axios';
import type { Vehicle } from '../types/transit';

// 如果你的后端端口是 5001，请保持这个地址
const API_BASE_URL = 'http://localhost:5001/api';

export const fetchVehicles = async (): Promise<Vehicle[]> => {
  try {
    const response = await axios.get<{ success: boolean; data: Vehicle[] }>(
      `${API_BASE_URL}/vehicles`
    );
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
    return []; // 出错时返回空数组，防止页面崩溃
  }
};