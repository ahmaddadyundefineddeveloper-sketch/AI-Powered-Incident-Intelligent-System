import { useMemo } from 'react';
import { formatConfidenceNumber } from '../../utils/formatters';

const StatCard = ({ icon, iconBg, iconColor, label, value, extra }) => (
  <div className="card p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
        <span className={`material-symbols-outlined ${iconColor}`} style={{ fontSize: '20px' }}>
          {icon}
        </span>
      </div>
    </div>
    <div>
      <p className="text-xs font-semibold text-[#434655] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-[#191c1e]">
        {value !== undefined && value !== null ? value : <span className="text-[#737686]">—</span>}
      </p>
    </div>
    {extra && <div className="mt-1">{extra}</div>}
  </div>
);

const IncidentStats = ({ stats, incidents }) => {
  const avgConfidence = useMemo(() => {
    if (!incidents || incidents.length === 0) return null;
    // Field is `confidence` (0–1), not `aiConfidence`
    const withConf = incidents.filter(
      (i) => i.confidence !== null && i.confidence !== undefined
    );
    if (withConf.length === 0) return null;
    const sum = withConf.reduce((acc, i) => {
      // Values are stored as 0–1 floats, convert to percentage
      const v = typeof i.confidence === 'number' && i.confidence <= 1
        ? i.confidence * 100
        : i.confidence;
      return acc + v;
    }, 0);
    return Math.round(sum / withConf.length);
  }, [incidents]);

  const ConfidenceExtra = () =>
    avgConfidence !== null ? (
      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-[#e0e3e5] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#004ac6] transition-all"
            style={{ width: `${avgConfidence}%` }}
          />
        </div>
        <p className="text-xs text-[#737686]">Based on {incidents?.length || 0} incidents</p>
      </div>
    ) : (
      <p className="text-xs text-[#737686]">No data available</p>
    );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <StatCard
        icon="warning"
        iconBg="bg-[#dbe1ff]"
        iconColor="text-[#004ac6]"
        label="Active Incidents"
        value={stats?.activeIncidents}
      />
      <StatCard
        icon="emergency"
        iconBg="bg-[#ffdad6]"
        iconColor="text-[#ba1a1a]"
        label="Critical Incidents"
        value={stats?.criticalIncidents}
      />
      <StatCard
        icon="receipt_long"
        iconBg="bg-[#eceef0]"
        iconColor="text-[#434655]"
        label="Reports Received"
        value={stats?.totalReports}
      />
      <StatCard
        icon="psychology"
        iconBg="bg-[#dbe1ff]"
        iconColor="text-[#004ac6]"
        label="Avg AI Confidence"
        value={avgConfidence !== null ? `${avgConfidence}%` : '—'}
        extra={<ConfidenceExtra />}
      />
    </div>
  );
};

export default IncidentStats;
