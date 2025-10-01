import axios from 'axios';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { AlertRepository, ServiceAlertRow } from '../repositories/alertRepository';
import { env } from '../config/env';

const ALERT_FEED_URL = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys/all-alerts';

const EFFECT_MAP: Record<number, string> = {
  1: 'NO_SERVICE',
  2: 'REDUCED_SERVICE',
  3: 'SIGNIFICANT_DELAYS',
  4: 'DETOUR',
  5: 'ADDITIONAL_SERVICE',
  6: 'MODIFIED_SERVICE',
  7: 'OTHER_EFFECT',
  8: 'UNKNOWN_EFFECT',
  9: 'STOP_MOVED',
  10: 'NO_EFFECT',
  11: 'ACCESSIBILITY_ISSUE',
};

const CAUSE_MAP: Record<number, string> = {
  1: 'UNKNOWN_CAUSE',
  2: 'OTHER_CAUSE',
  3: 'TECHNICAL_PROBLEM',
  4: 'STRIKE',
  5: 'DEMONSTRATION',
  6: 'ACCIDENT',
  7: 'HOLIDAY',
  8: 'WEATHER',
  9: 'MAINTENANCE',
  10: 'CONSTRUCTION',
  11: 'POLICE_ACTIVITY',
  12: 'MEDICAL_EMERGENCY',
};

export class AlertService {
  static async fetchAndSaveAlerts() {
    try {
      const response = await axios.get(ALERT_FEED_URL, {
        responseType: 'arraybuffer',
        headers: {
          Accept: 'application/x-protobuf',
          ...(env.MTA_API_KEY ? { 'x-api-key': env.MTA_API_KEY } : {}),
        },
        timeout: 10000,
      });

      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(response.data)
      );

      const parsed: ServiceAlertRow[] = [];
      const now = Math.floor(Date.now() / 1000);

      for (const entity of feed.entity) {
        if (!entity.alert || !entity.id) continue;
        const alert = entity.alert;
        const informed = alert.informedEntity || [];

        const routeIds = Array.from(
          new Set(informed.map((i: any) => String(i.routeId || '').toUpperCase()).filter(Boolean))
        );
        const stopIds = Array.from(
          new Set(informed.map((i: any) => String(i.stopId || '').toUpperCase()).filter(Boolean))
        );

        const header = alert.headerText?.translation?.[0]?.text || null;
        const description = alert.descriptionText?.translation?.[0]?.text || null;
        const effect = alert.effect != null ? (EFFECT_MAP[Number(alert.effect)] || String(alert.effect)) : null;
        const cause = alert.cause != null ? (CAUSE_MAP[Number(alert.cause)] || String(alert.cause)) : null;

        parsed.push({
          id: String(entity.id),
          header_text: header,
          description_text: description,
          effect_text: effect,
          cause_text: cause,
          route_ids: routeIds,
          stop_ids: stopIds,
          updated_at: now,
        });
      }

      await AlertRepository.upsertBatch(parsed);
      console.log(`🚨 服务告警同步完成，共 ${parsed.length} 条`);
    } catch (e: any) {
      console.error('❌ 服务告警同步失败:', e.message);
    }
  }
}
