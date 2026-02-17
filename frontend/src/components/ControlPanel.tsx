// src/components/ControlPanel.tsx
import React from 'react';
import { ROUTE_COLORS } from '../config/constants';
import type { FavoriteStop, NotificationItem, NotificationSettings, User, VehicleInsightPoint } from '../types/transit';
import type { Language, TranslateFn } from '../i18n';

interface DropdownOption {
  value: string;
  label: string;
}

const StyledDropdown: React.FC<{
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  onOpenChange?: (open: boolean) => void;
}> = ({ value, options, onChange, ariaLabel, onOpenChange }) => {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value) || options[0];
  React.useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  return (
    <div
      className="relative"
      tabIndex={0}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (!next || !e.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-green-500/35 bg-black/35 px-2 py-1.5 text-xs text-white outline-none transition hover:bg-black/45 focus:border-green-400/80"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
      >
        <span>{selected?.label}</span>
        <span className={`ml-2 text-[10px] text-green-300 transition ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-full overflow-hidden rounded-lg border border-green-500/35 bg-[rgba(10,10,10,0.98)] shadow-[0_12px_28px_rgba(0,0,0,0.55)]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full px-2 py-2 text-left text-xs transition ${
                opt.value === value
                  ? 'bg-green-500/18 text-green-200'
                  : 'text-gray-200 hover:bg-green-500/10 hover:text-green-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

interface Props {
  selectedRoute: string;
  onSelectRoute: (route: string) => void;
  count: number;
  timeRange: '15m' | '1h' | '6h' | '24h';
  compareMode: 'none' | 'previous';
  onTimeRangeChange: (range: '15m' | '1h' | '6h' | '24h') => void;
  onCompareModeChange: (mode: 'none' | 'previous') => void;
  trendSeries: VehicleInsightPoint[];
  previousTrendSeries: VehicleInsightPoint[];
  averageCount: number;
  comparisonDelta: number | null;
  comparisonPercent: number | null;
  topRoutes: Array<{ routeId: string; vehicleCount: number }>;
  language: Language;
  onLanguageChange: (language: Language) => void;
  t: TranslateFn;
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
  onMarkNotificationRead: (id: number) => void;
  onMarkAllNotificationsRead: () => void;
  unreadCount: number;
}

const ControlPanel: React.FC<Props> = ({
  selectedRoute,
  onSelectRoute,
  count,
  timeRange,
  compareMode,
  onTimeRangeChange,
  onCompareModeChange,
  trendSeries,
  previousTrendSeries,
  averageCount,
  comparisonDelta,
  comparisonPercent,
  topRoutes,
  language,
  onLanguageChange,
  t,
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
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  unreadCount,
}) => {
  const [selectedNotification, setSelectedNotification] = React.useState<NotificationItem | null>(null);
  const [insightExpanded, setInsightExpanded] = React.useState(false);
  const [insightDropdownOpen, setInsightDropdownOpen] = React.useState({
    range: false,
    compare: false,
  });

  const closeNotificationModal = () => setSelectedNotification(null);
  const sectionClass = 'mt-4 rounded-2xl border border-green-500/35 bg-black/35 p-4';
  const isInsightOpen = insightDropdownOpen.range || insightDropdownOpen.compare;
  const currentWindowPoints = trendSeries.map((p) => p.count);
  const previousWindowPoints = previousTrendSeries.map((p) => p.count);
  const chartPoints = currentWindowPoints.length > 1 ? currentWindowPoints : [count, count];
  const currentMinPoint = Math.min(...chartPoints);
  const currentMaxPoint = Math.max(...chartPoints);
  const hasPreviousSeries = compareMode === 'previous' && previousWindowPoints.length > 1;
  const yScalePoints = hasPreviousSeries ? [...chartPoints, ...previousWindowPoints] : chartPoints;
  const minPoint = Math.min(...yScalePoints);
  const maxPoint = Math.max(...yScalePoints);
  const pointRange = Math.max(maxPoint - minPoint, 1);
  const latestPoint = chartPoints[chartPoints.length - 1] ?? count;
  const firstPoint = chartPoints[0] ?? count;
  const startToNowDelta = latestPoint - firstPoint;
  const startToNowPercent = firstPoint === 0 ? null : Math.round((startToNowDelta / firstPoint) * 100);
  const mean = chartPoints.reduce((sum, v) => sum + v, 0) / chartPoints.length;
  const variance = chartPoints.reduce((sum, v) => sum + (v - mean) ** 2, 0) / chartPoints.length;
  const volatility = Number(Math.sqrt(variance).toFixed(1));
  const anomalyThreshold = Math.max(volatility * 1.6, 3);
  const anomalyIndexes = chartPoints
    .map((value, idx) => ({ idx, value }))
    .filter((item) => Math.abs(item.value - mean) >= anomalyThreshold)
    .map((item) => item.idx);
  const anomalySet = new Set(anomalyIndexes);
  const peakIndex = chartPoints.findIndex((p) => p === currentMaxPoint);
  const troughIndex = chartPoints.findIndex((p) => p === currentMinPoint);
  const topRouteSharePercent =
    topRoutes.length > 0 && averageCount > 0
      ? Math.round((topRoutes[0].vehicleCount / averageCount) * 100)
      : null;
  const trendSummaryKey =
    startToNowDelta > 2 ? 'gettingBusier' : startToNowDelta < -2 ? 'gettingCalmer' : 'mostlyStable';

  const sparklinePath = chartPoints
    .map((point, idx) => {
      const x = (idx / (chartPoints.length - 1 || 1)) * 100;
      // Keep top/bottom padding so flat trends remain visible.
      const y = 90 - ((point - minPoint) / pointRange) * 80;
      return `${x},${y}`;
    })
    .join(' ');
  const maxRouteCount = topRoutes.length > 0 ? Math.max(...topRoutes.map((r) => r.vehicleCount)) : 1;
  const detailedPoints = chartPoints.map((point, idx) => {
    const x = (idx / (chartPoints.length - 1 || 1)) * 100;
    const y = 92 - ((point - minPoint) / pointRange) * 84;
    return { idx, x, y, point };
  });
  const previousDetailedPoints = previousWindowPoints.map((point, idx) => {
    const x = (idx / (previousWindowPoints.length - 1 || 1)) * 100;
    const y = 92 - ((point - minPoint) / pointRange) * 84;
    return { idx, x, y, point };
  });
  const detailedPath = detailedPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const previousDetailedPath = previousDetailedPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`);
  const tickIndices = (() => {
    if (trendSeries.length <= 1) return [0];
    const raw = [0, Math.floor((trendSeries.length - 1) / 3), Math.floor(((trendSeries.length - 1) * 2) / 3), trendSeries.length - 1];
    return Array.from(new Set(raw));
  })();
  const formatTickTime = (ts?: number) => {
    if (!ts) return '--:--';
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return (
    <>
      <div className="absolute top-5 left-5 z-10 w-[23rem] max-h-[calc(100vh-2.5rem)] overflow-auto rounded-3xl border border-green-500/35 bg-[rgba(15,15,15,0.88)] p-5 text-white shadow-2xl backdrop-blur-md">
        <div className="mb-4 border-b border-green-500/25 pb-4">
          <h1 className="m-0 text-2xl font-black tracking-tighter">{t('transitConsole')}</h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-green-400">{t('nycNode')}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-neutral-300">{t('language')}</span>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="rounded-lg border border-green-500/35 bg-black/35 px-2 py-1 text-[11px] text-white outline-none transition focus:border-green-400/80"
            >
              <option value="en" className="bg-neutral-900">{t('lang_en')}</option>
              <option value="zh" className="bg-neutral-900">{t('lang_zh')}</option>
              <option value="es" className="bg-neutral-900">{t('lang_es')}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedRoute}
            onChange={(e) => onSelectRoute(e.target.value)}
            className="flex-1 cursor-pointer appearance-none rounded-2xl border border-green-500/35 bg-black/35 px-3 py-3 text-sm font-semibold text-white outline-none transition hover:bg-black/45 focus:border-green-400/80"
            title={t('allActiveLines')}
          >
            <option value="ALL">{t('allActiveLines')}</option>
            {Object.keys(ROUTE_COLORS).map((route) => (
              <option key={route} value={route} className="bg-neutral-900">
                {route} {t('lineSuffix')}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!user || selectedRoute === 'ALL'}
            onClick={() => selectedRoute !== 'ALL' && onToggleRouteFavorite(selectedRoute)}
            className={`w-12 rounded-2xl border text-xl transition ${
              selectedRoute !== 'ALL' && favoriteRoutes.has(selectedRoute)
                ? 'border-yellow-400/70 bg-yellow-400/15 text-yellow-300 shadow-[0_0_16px_rgba(250,204,21,0.22)]'
                : 'border-green-500/35 bg-black/35 text-gray-300'
            } ${!user ? 'cursor-not-allowed opacity-40' : 'hover:bg-black/45'}`}
            title={!user ? t('loginRequiredRoute') : t('favoriteThisRoute')}
          >
            ★
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/18 via-green-500/10 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-extrabold leading-none text-white">{count}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/80">
                {t('activeVehicles')}
              </div>
            </div>
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
          </div>
        </div>

        <div
          className={`${sectionClass} transition ${
            isInsightOpen
              ? 'border-green-400/70 shadow-[0_0_18px_rgba(34,197,94,0.2)]'
              : ''
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-white">{t('insightWindow')}</div>
            <div className="flex items-center gap-2">
              <div className="text-[11px] text-gray-400">{t('windowAvg')}: {averageCount}</div>
              <button
                type="button"
                onClick={() => setInsightExpanded(true)}
                className="rounded-md border border-green-400/35 px-2 py-1 text-[10px] font-semibold text-green-200 transition hover:bg-green-500/15"
              >
                {t('expand')}
              </button>
            </div>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <StyledDropdown
              value={timeRange}
              onChange={(value) => onTimeRangeChange(value as '15m' | '1h' | '6h' | '24h')}
              ariaLabel={t('insightWindow')}
              onOpenChange={(open) =>
                setInsightDropdownOpen((prev) => ({ ...prev, range: open }))
              }
              options={[
                { value: '15m', label: t('range15m') },
                { value: '1h', label: t('range1h') },
                { value: '6h', label: t('range6h') },
                { value: '24h', label: t('range24h') },
              ]}
            />
            <StyledDropdown
              value={compareMode}
              onChange={(value) => onCompareModeChange(value as 'none' | 'previous')}
              ariaLabel={t('comparePrevious')}
              onOpenChange={(open) =>
                setInsightDropdownOpen((prev) => ({ ...prev, compare: open }))
              }
              options={[
                { value: 'none', label: t('compareNone') },
                { value: 'previous', label: t('comparePrevious') },
              ]}
            />
          </div>

          <div className="h-16 rounded-lg border border-green-500/20 bg-black/30 p-2">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(34,197,94,0.4)" />
                  <stop offset="100%" stopColor="rgba(74,222,128,1)" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="url(#trendStroke)"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={sparklinePath}
              />
            </svg>
          </div>

          <div className="mt-2 text-xs">
            {comparisonDelta == null ? (
              <span className="text-gray-400">{t('noComparisonData')}</span>
            ) : (
              <span className={comparisonDelta >= 0 ? 'text-green-300' : 'text-red-300'}>
                {comparisonDelta >= 0 ? '+' : ''}
                {comparisonDelta}{' '}
                {t('vsPrevious')}
                {comparisonPercent != null ? ` (${comparisonPercent >= 0 ? '+' : ''}${comparisonPercent}%)` : ''}
              </span>
            )}
          </div>

          <div className="mt-3 border-t border-green-500/20 pt-3">
            <div className="mb-2 text-[11px] uppercase tracking-wide text-gray-300">{t('topActiveRoutes')}</div>
            {topRoutes.length > 0 ? (
              <div className="space-y-1.5">
                {topRoutes.map((route) => {
                  const width = Math.max((route.vehicleCount / maxRouteCount) * 100, 8);
                  return (
                    <div key={route.routeId} className="flex items-center gap-2 text-xs">
                      <span className="w-5 font-semibold text-green-300">{route.routeId}</span>
                      <div className="h-2 flex-1 rounded-full bg-black/50">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-green-500/55 to-green-300/80"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-gray-300">{route.vehicleCount}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-gray-500">{t('noRouteData')}</div>
            )}
          </div>
        </div>

        {!user ? (
          <div className={sectionClass}>
            <div>
              <div className="mb-3 flex overflow-hidden rounded-xl border border-green-500/35 text-xs">
                <button
                  type="button"
                  onClick={() => onAuthModeChange('login')}
                  className={`flex-1 py-2 ${authMode === 'login' ? 'bg-green-600/90' : 'bg-white/[0.05] hover:bg-white/[0.1]'}`}
                >
                  {t('login')}
                </button>
                <button
                  type="button"
                  onClick={() => onAuthModeChange('register')}
                  className={`flex-1 py-2 ${authMode === 'register' ? 'bg-green-600/90' : 'bg-white/[0.05] hover:bg-white/[0.1]'}`}
                >
                  {t('register')}
                </button>
              </div>
              <input
                type="email"
                placeholder={t('email')}
                value={authForm.email}
                onChange={(e) => onAuthFormChange({ ...authForm, email: e.target.value })}
                className="mb-2 w-full rounded-xl border border-green-500/35 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-green-400/80"
              />
              <input
                type="password"
                placeholder={t('passwordHint')}
                value={authForm.password}
                onChange={(e) => onAuthFormChange({ ...authForm, password: e.target.value })}
                className="mb-2 w-full rounded-xl border border-green-500/35 bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-green-400/80"
              />
              <button
                type="button"
                onClick={onSubmitAuth}
                className="w-full rounded-xl bg-green-600 py-2 text-sm font-semibold transition hover:bg-green-500"
              >
                {authMode === 'login' ? t('login') : t('createAccount')}
              </button>
            </div>
          </div>
        ) : null}

        {user ? (
          <>
            <div className={sectionClass}>
              <div className="mb-3 text-sm font-semibold text-gray-100">{t('favorites')}</div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">{t('routes')}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(favoriteRoutes).length > 0 ? (
                      Array.from(favoriteRoutes)
                        .sort()
                        .map((r) => (
                          <span
                            key={r}
                            className="rounded-lg border border-yellow-500/35 bg-yellow-400/15 px-2 py-1 text-yellow-100"
                          >
                            {r}
                          </span>
                        ))
                    ) : (
                      <span className="text-gray-500">{t('noFavoriteRoutes')}</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">{t('stops')}</div>
                  <div className="max-h-20 space-y-1 overflow-auto pr-1 text-yellow-100/90">
                    {favoriteStops.length > 0 ? (
                      favoriteStops.map((s) => <div key={s.stop_id}>{s.stop_name || s.stop_id}</div>)
                    ) : (
                      <div className="text-gray-500">{t('noFavoriteStops')}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-yellow-500/35 bg-gradient-to-b from-yellow-500/12 to-yellow-500/6 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xl font-bold text-yellow-300">{t('notificationCenter')}</div>
                <div className="rounded-full border border-yellow-300/30 bg-yellow-500/20 px-2 py-0.5 text-[11px] text-yellow-100">
                  {unreadCount} {t('unread')}
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-yellow-500/20 bg-black/15 px-3 py-2">
                <span className="text-xs font-medium text-yellow-100">{t('email')}</span>
                <button
                  type="button"
                  onClick={() => onToggleEmailNotifications(!notificationSettings?.email_notifications_enabled)}
                  className={`relative h-6 w-11 rounded-full transition ${
                    notificationSettings?.email_notifications_enabled ? 'bg-green-500/90' : 'bg-white/20'
                  }`}
                  aria-label={t('email')}
                >
                  <span
                    className={`absolute top-[2px] h-5 w-5 rounded-full bg-white transition ${
                      notificationSettings?.email_notifications_enabled ? 'left-[22px]' : 'left-[2px]'
                    }`}
                  />
                </button>
              </div>

              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={onMarkAllNotificationsRead}
                  className="rounded-lg border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.15]"
                >
                  {t('markAllRead')}
                </button>
              </div>

              {notificationCenter.length > 0 ? (
                <div className="max-h-56 space-y-2 overflow-auto pr-1">
                  {notificationCenter.slice(0, 20).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        onMarkNotificationRead(n.id);
                        setSelectedNotification(n);
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        n.is_read
                          ? 'border-yellow-700/40 bg-yellow-500/[0.06] text-yellow-100/70'
                          : 'border-yellow-300/50 bg-yellow-500/[0.14] text-yellow-100 hover:bg-yellow-500/[0.2]'
                      }`}
                    >
                      <div className="line-clamp-1 text-sm font-semibold">{n.title}</div>
                      <div className="mt-0.5 text-[11px] text-yellow-200/80">{n.effect_text || t('update')}</div>
                      {n.body ? <div className="mt-1 line-clamp-2 text-xs text-yellow-100/90">{n.body}</div> : null}
                      <div className="mt-1 text-[10px] opacity-80">
                        {n.email_sent ? t('emailSent') : t('emailPending')}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-yellow-100/80">{t('noNotifications')}</div>
              )}
            </div>
            <div className={sectionClass}>
              <div className="text-sm font-semibold text-white">
                {t('signedInAs')}: <span className="text-white">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 w-full rounded-xl border border-green-500/35 bg-black/35 py-2 text-sm font-medium text-white transition hover:bg-black/45"
              >
                {t('signOut')}
              </button>
            </div>
          </>
        ) : null}
      </div>

      {selectedNotification ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 backdrop-blur-[2px] px-4"
          onClick={closeNotificationModal}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl border border-yellow-500/40 bg-neutral-900 text-yellow-100 shadow-[0_0_30px_rgba(234,179,8,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-yellow-500/20 bg-neutral-900/95 px-5 py-4 backdrop-blur">
              <div>
                <div className="text-xs uppercase tracking-wider text-yellow-300/80">
                  {selectedNotification.effect_text || t('serviceAlert')}
                </div>
                <h3 className="mt-1 text-lg font-semibold leading-tight text-yellow-100">
                  {selectedNotification.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeNotificationModal}
                className="h-8 w-8 rounded-full border border-yellow-500/30 text-yellow-100 hover:bg-yellow-500/20"
                aria-label="Close notification details"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 px-5 py-4 text-sm text-yellow-100/95">
              <p className="whitespace-pre-wrap leading-relaxed">
                {selectedNotification.body || t('noDetails')}
              </p>
              <div className="text-xs text-yellow-200/80">
                <div>
                  {selectedNotification.email_sent ? t('emailSent') : t('emailPending')}
                </div>
                <div className="mt-1">
                  {t('createdAt')}: {new Date(selectedNotification.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {insightExpanded ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] px-4"
          onClick={() => setInsightExpanded(false)}
        >
          <div
            className="w-full max-w-5xl max-h-[86vh] overflow-auto rounded-2xl border border-green-500/35 bg-neutral-950 text-white shadow-[0_0_36px_rgba(34,197,94,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-green-500/20 bg-neutral-950/95 px-5 py-4 backdrop-blur">
              <div>
                <h3 className="text-xl font-bold">{t('detailedInsights')}</h3>
                <div className="mt-1 text-sm text-gray-300">{t('trendSummary')}: {t(trendSummaryKey)}</div>
              </div>
              <button
                type="button"
                onClick={() => setInsightExpanded(false)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-gray-100 transition hover:bg-white/[0.08]"
              >
                {t('close')}
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-xl border border-green-500/25 bg-black/30 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">{t('currentSnapshot')}</div>
                  <div className="mt-1 text-2xl font-extrabold text-green-200">{latestPoint}</div>
                </div>
                <div className="rounded-xl border border-green-500/25 bg-black/30 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">{t('startToNow')}</div>
                  <div className={`mt-1 text-2xl font-extrabold ${startToNowDelta >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {formatSigned(startToNowDelta)}
                    {startToNowPercent != null ? (
                      <span className="ml-1 text-sm font-semibold">
                        ({formatSigned(startToNowPercent)}%)
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="rounded-xl border border-green-500/25 bg-black/30 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">{t('peakValue')} / {t('troughValue')}</div>
                  <div className="mt-1 text-2xl font-extrabold text-white">{maxPoint} / {minPoint}</div>
                </div>
                <div className="rounded-xl border border-green-500/25 bg-black/30 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">{t('volatility')}</div>
                  <div className="mt-1 text-2xl font-extrabold text-white">{volatility}</div>
                </div>
              </div>

              <div className="rounded-xl border border-green-500/25 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-gray-300">
                  <span>{t('insightWindow')}</span>
                  <span>{t('windowAvg')}: {averageCount}</span>
                </div>
                <div className="h-64 rounded-lg border border-green-500/20 bg-black/40 p-2">
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="h-full w-full"
                  >
                    <defs>
                      <linearGradient id="trendStrokeDetailed" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(34,197,94,0.45)" />
                        <stop offset="100%" stopColor="rgba(74,222,128,1)" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="none"
                      stroke="url(#trendStrokeDetailed)"
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={detailedPath}
                    />
                    {hasPreviousSeries ? (
                      <polyline
                        fill="none"
                        stroke="rgba(148,163,184,0.9)"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        strokeDasharray="2 2"
                        points={previousDetailedPath}
                      />
                    ) : null}
                    {detailedPoints.map((p, idx) => (
                      <circle
                        key={`${p.idx}-${p.point}`}
                        cx={p.x}
                        cy={p.y}
                        r={1.1}
                        fill={anomalySet.has(idx) ? '#f87171' : '#4ade80'}
                      />
                    ))}
                    <line x1={0} y1={95} x2={100} y2={95} stroke="rgba(148,163,184,0.45)" strokeWidth="0.5" />
                  </svg>
                </div>
                <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-300">
                  {tickIndices.map((tickIdx) => (
                    <span
                      key={`tick-label-${tickIdx}`}
                      className="select-none"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatTickTime(trendSeries[tickIdx]?.ts)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-green-500/25 bg-black/25 p-3">
                  <div className="mb-2 text-xs uppercase tracking-wide text-gray-400">{t('topActiveRoutes')}</div>
                  {topRoutes.length > 0 ? (
                    <div className="space-y-2">
                      {topRoutes.map((route) => {
                        const width = Math.max((route.vehicleCount / maxRouteCount) * 100, 8);
                        return (
                          <div key={`expanded-${route.routeId}`} className="flex items-center gap-2 text-xs">
                            <span className="w-5 font-semibold text-green-300">{route.routeId}</span>
                            <div className="h-2 flex-1 rounded-full bg-black/50">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-green-500/55 to-green-300/80"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                            <span className="w-7 text-right text-gray-300">{route.vehicleCount}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">{t('noRouteData')}</div>
                  )}
                </div>
                <div className="rounded-xl border border-green-500/25 bg-black/25 p-3 text-sm text-gray-200">
                  <div className="text-xs uppercase tracking-wide text-gray-400">{t('trendSummary')}</div>
                  <div className="mt-2">{t(trendSummaryKey)}</div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-green-300">
                      <span className="h-2 w-2 rounded-full bg-green-300" />
                      {t('currentWindow')}
                    </span>
                    {hasPreviousSeries ? (
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <span className="h-[2px] w-3 bg-slate-300" />
                        {t('previousWindow')}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-xs text-gray-300">
                    {comparisonDelta == null
                      ? t('noComparisonData')
                      : `${formatSigned(comparisonDelta)} ${t('vsPrevious')}${
                          comparisonPercent != null ? ` (${formatSigned(comparisonPercent)}%)` : ''
                        }`}
                  </div>
                  <div className="mt-2 text-xs text-gray-300">
                    {t('windowAvg')}: {averageCount}
                  </div>
                  <div className="mt-2 text-xs text-gray-300">
                    {t('peakValue')}: {currentMaxPoint} ({t('samplePoint')} {peakIndex + 1}) | {t('troughValue')}: {currentMinPoint} ({t('samplePoint')} {troughIndex + 1})
                  </div>
                  <div className="mt-2 text-xs text-gray-300">
                    {t('topRouteShare')}: {topRouteSharePercent == null ? '--' : `${topRouteSharePercent}%`}
                  </div>
                  <div className="mt-2 text-xs text-gray-300">
                    {t('anomalyPoints')}: {anomalyIndexes.length} ({t('anomalyHint')})
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ControlPanel;