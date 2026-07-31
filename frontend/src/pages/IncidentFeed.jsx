import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActivityFeed, getReportsFeed } from '../api/feed.api';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { formatRelativeTime, formatConfidence } from '../utils/formatters';

// ── Event type config ──────────────────────────────────────────────────────────
const EVENT_CONFIG = {
  created: {
    icon: 'add_circle',
    iconColor: 'text-[#004ac6]',
    iconBg: 'bg-[#dbe1ff]',
    label: 'New Incident Created',
    borderColor: 'border-l-[#004ac6]',
  },
  merged: {
    icon: 'merge',
    iconColor: 'text-[#505f76]',
    iconBg: 'bg-[#d0e1fb]',
    label: 'Report Merged',
    borderColor: 'border-l-[#505f76]',
  },
  severity_changed: {
    icon: 'priority_high',
    iconColor: 'text-[#ba1a1a]',
    iconBg: 'bg-[#ffdad6]',
    label: 'Severity Escalated',
    borderColor: 'border-l-[#ba1a1a]',
  },
  briefing_updated: {
    icon: 'auto_awesome',
    iconColor: 'text-[#0053db]',
    iconBg: 'bg-[#dbe1ff]',
    label: 'Briefing Updated',
    borderColor: 'border-l-[#0053db]',
  },
  status_changed: {
    icon: 'flag',
    iconColor: 'text-[#943700]',
    iconBg: 'bg-[#ffede6]',
    label: 'Status Changed',
    borderColor: 'border-l-[#943700]',
  },
  confidence_changed: {
    icon: 'trending_up',
    iconColor: 'text-[#004ac6]',
    iconBg: 'bg-[#dbe1ff]',
    label: 'Confidence Updated',
    borderColor: 'border-l-[#004ac6]',
  },
};

const EVENT_TYPE_FILTERS = [
  { value: '', label: 'All Activity' },
  { value: 'created', label: 'New Incidents' },
  { value: 'merged', label: 'Merges' },
  { value: 'severity_changed', label: 'Escalations' },
  { value: 'briefing_updated', label: 'Briefings' },
  { value: 'status_changed', label: 'Status Changes' },
];

const SEVERITY_FILTERS = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// SOURCE icons for reports tab
const SOURCE_ICONS = {
  whatsapp: 'chat', facebook: 'thumb_up', x: 'tag',
  phone: 'phone', officer: 'badge', other: 'report',
};

// ── Activity event card ────────────────────────────────────────────────────────
function ActivityCard({ event, onClick }) {
  const cfg = EVENT_CONFIG[event.eventType] || {
    icon: 'info', iconColor: 'text-[#434655]', iconBg: 'bg-[#eceef0]',
    label: event.eventType, borderColor: 'border-l-[#c3c6d7]',
  };
  const incident = event.incidentId; // populated

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#c3c6d7] border-l-4 ${cfg.borderColor} rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${cfg.iconBg}`}>
          <span className={`material-symbols-outlined ${cfg.iconColor}`} style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
            {cfg.icon}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-wide ${cfg.iconColor}`}>
              {cfg.label}
            </span>
            <span className="text-[11px] text-[#737686] flex-shrink-0">
              {formatRelativeTime(event.createdAt)}
            </span>
          </div>

          {/* Incident title */}
          {incident && (
            <p className="text-sm font-semibold text-[#191c1e] truncate mb-1">
              {incident.title}
            </p>
          )}

          {/* Reason / detail */}
          {event.reason && (
            <p className="text-xs text-[#434655] leading-relaxed mb-2">
              {event.reason}
            </p>
          )}

          {/* Before → After for severity change */}
          {event.eventType === 'severity_changed' && event.before?.severity && event.after?.severity && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="severity" value={event.before.severity} />
              <span className="material-symbols-outlined text-[#434655]" style={{ fontSize: '14px' }}>arrow_forward</span>
              <Badge variant="severity" value={event.after.severity} />
            </div>
          )}

          {/* Incident badges */}
          {incident && (
            <div className="flex items-center gap-2 flex-wrap">
              {incident.category && <Badge variant="category" value={incident.category} />}
              {incident.severity && <Badge variant="severity" value={incident.severity} />}
              {incident.location?.text && (
                <span className="text-[11px] text-[#737686] flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>location_on</span>
                  {incident.location.text}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Report card ────────────────────────────────────────────────────────────────
function ReportCard({ report, onClick }) {
  const icon = SOURCE_ICONS[report.sourceType] || 'report';
  const hasImage = report.mediaAssets?.some((a) => a.url);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#c3c6d7] rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Source icon */}
        <div className="w-9 h-9 rounded-full bg-[#eceef0] flex-shrink-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-[#434655]" style={{ fontSize: '16px' }}>{icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#434655] capitalize">{report.sourceType}</span>
              {report.understanding?.category && <Badge variant="category" value={report.understanding.category} />}
              {report.understanding?.severity && <Badge variant="severity" value={report.understanding.severity} />}
              {hasImage && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-[#004ac6] font-semibold bg-[#dbe1ff] px-1.5 py-0.5 rounded-full">
                  <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>image</span>
                  Photo
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#737686] flex-shrink-0">
              {formatRelativeTime(report.timestamp)}
            </span>
          </div>

          {/* Description */}
          {report.description && (
            <p className="text-sm text-[#191c1e] leading-relaxed mb-2 line-clamp-2">
              {report.description}
            </p>
          )}

          {/* AI summary if different from description */}
          {report.understanding?.summary && report.understanding.summary !== report.description && (
            <p className="text-xs text-[#434655] italic mb-2 line-clamp-1">
              AI: {report.understanding.summary}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {report.location?.text && (
                <span className="text-[11px] text-[#737686] flex items-center gap-0.5">
                  <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>location_on</span>
                  {report.location.text}
                </span>
              )}
            </div>
            {/* Linked incident */}
            {report.incidentId && (
              <span className="text-[10px] font-semibold text-[#004ac6] bg-[#dbe1ff] px-2 py-0.5 rounded-full">
                → {report.incidentId.title?.slice(0, 30)}…
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function IncidentFeed() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('activity'); // 'activity' | 'reports'
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (severityFilter) params.severity = severityFilter;

      if (tab === 'activity') {
        if (eventTypeFilter) params.eventType = eventTypeFilter;
        const result = await getActivityFeed(params);
        setData(result);
      } else {
        const result = await getReportsFeed(params);
        setData(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, eventTypeFilter, severityFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [tab, eventTypeFilter, severityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const items = tab === 'activity' ? (data?.events || []) : (data?.reports || []);
  const pagination = data?.pagination;

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">

      {/* Header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#191c1e] tracking-tight mb-1">Incident Feed</h2>
          <p className="text-xs md:text-sm text-[#434655]">
            Live stream of all activity — merges, escalations, briefings, and incoming reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 bg-white border border-[#c3c6d7] rounded-lg px-3 py-2 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ba1a1a] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ba1a1a]" />
            </span>
            <span className="text-xs font-semibold text-[#191c1e]">Live · refreshes every 30s</span>
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-full text-[#434655] hover:bg-[#e6e8ea] hover:text-[#004ac6] transition-colors"
            title="Refresh now"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-[#f2f4f6] rounded-xl p-1 w-fit mb-5 overflow-x-auto max-w-full">
        <button
          onClick={() => setTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'activity' ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#434655] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>timeline</span>
          Activity Stream
          {tab === 'activity' && pagination?.total != null && (
            <span className="bg-[#004ac6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pagination.total}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'reports' ? 'bg-white text-[#191c1e] shadow-sm' : 'text-[#434655] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>article</span>
          Raw Reports
          {tab === 'reports' && pagination?.total != null && (
            <span className="bg-[#004ac6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pagination.total}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3">
        {/* Event type filter — scrollable on mobile */}
        {tab === 'activity' && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {EVENT_TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setEventTypeFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                  eventTypeFilter === f.value
                    ? 'bg-[#004ac6] text-white'
                    : 'bg-white border border-[#c3c6d7] text-[#434655] hover:bg-[#f2f4f6]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        {/* Severity filter — scrollable on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSeverityFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                severityFilter === f.value
                  ? 'bg-[#191c1e] text-white'
                  : 'bg-white border border-[#c3c6d7] text-[#434655] hover:bg-[#f2f4f6]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {pagination && (
          <span className="text-xs text-[#737686]">
            {pagination.total} total · page {pagination.page} of {pagination.totalPages}
          </span>
        )}
      </div>

      {/* Feed */}
      {loading && page === 1 ? (
        <Spinner centered />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-[#ba1a1a]">{error}</p>
          <button onClick={fetchData} className="text-xs text-[#004ac6] hover:underline">Try again</button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="feed"
          title="Nothing here yet"
          message={
            tab === 'activity'
              ? 'Activity will appear as reports are submitted and the AI pipeline runs.'
              : 'No reports match the current filters.'
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {tab === 'activity'
              ? items.map((event) => (
                  <ActivityCard
                    key={event._id}
                    event={event}
                    onClick={() => event.incidentId?._id && navigate(`/incidents/${event.incidentId._id}`)}
                  />
                ))
              : items.map((report) => (
                  <ReportCard
                    key={report._id}
                    report={report}
                    onClick={() => report.incidentId?._id && navigate(`/incidents/${report.incidentId._id}`)}
                  />
                ))
            }
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 bg-white border border-[#c3c6d7] text-xs font-semibold text-[#434655] rounded-lg hover:bg-[#f2f4f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                        page === p
                          ? 'bg-[#004ac6] text-white'
                          : 'bg-white border border-[#c3c6d7] text-[#434655] hover:bg-[#f2f4f6]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                {pagination.totalPages > 5 && (
                  <span className="text-xs text-[#737686] px-2">… {pagination.totalPages}</span>
                )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="flex items-center gap-1 px-4 py-2 bg-white border border-[#c3c6d7] text-xs font-semibold text-[#434655] rounded-lg hover:bg-[#f2f4f6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Next
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
