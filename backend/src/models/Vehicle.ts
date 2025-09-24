// src/models/Vehicle.ts

export interface VehiclePositionRow {
  trip_id: string;
  route_id: string;
  lat: number;
  lon: number;
  timestamp: number;
  stop_name: string;
  current_status: string;
  direction: string;
  destination: string;
  consist: string | null;  
  created_at?: Date;
}

export interface VehicleEntity extends VehiclePositionRow {
}