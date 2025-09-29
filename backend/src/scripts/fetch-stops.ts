/**
 * 从 MTA GTFS 静态数据获取地铁站点坐标
 * 运行: npx ts-node -r tsconfig-paths/register src/scripts/fetch-stops.ts
 */
import axios from 'axios';
// @ts-ignore - adm-zip 无类型定义
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const GTFS_URL = 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_supplemented.zip';
const OUTPUT_PATH = path.join(__dirname, '../data/stops.json');

interface StopRecord {
  stop_id?: string;
  stop_lat?: string;
  stop_lon?: string;
  stop_name?: string;
}

async function fetchStops() {
  console.log('📥 正在下载 MTA GTFS 静态数据...');
  const response = await axios.get(GTFS_URL, { responseType: 'arraybuffer' });
  const zip = new AdmZip(Buffer.from(response.data));
  const stopsEntry = zip.getEntry('stops.txt');
  if (!stopsEntry) {
    throw new Error('GTFS 中未找到 stops.txt');
  }
  const stopsCsv = zip.readAsText(stopsEntry);
  const records = parse(stopsCsv, { columns: true, skip_empty_lines: true }) as StopRecord[];
  
  const stopsMap: Record<string, { lat: number; lon: number; name?: string }> = {};
  for (const r of records) {
    const stopId = r.stop_id?.trim();
    const lat = parseFloat(r.stop_lat || '');
    const lon = parseFloat(r.stop_lon || '');
    if (stopId && !isNaN(lat) && !isNaN(lon)) {
      stopsMap[stopId] = { lat, lon, name: r.stop_name };
    }
  }
  
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(stopsMap, null, 0), 'utf-8');
  console.log(`✅ 已保存 ${Object.keys(stopsMap).length} 个站点到 ${OUTPUT_PATH}`);
}

fetchStops().catch(console.error);
