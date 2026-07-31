import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useIncidents from '../hooks/useIncidents';
import IncidentStats from '../components/incident/IncidentStats';
import IncidentCard from '../components/incident/IncidentCard';
import MobileIncidentCard from '../components/incident/MobileIncidentCard';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

const SEVERITY_FILTERS = ['all', 'critical', 'high', 'medium', 'low'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState('all');

  const params = {};
  if (severityFilter !== 'all') params.severity = severityFilter;

  const { stats, incidents, loading, error, refetch } = useIncidents(params);

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">

      {/* Page header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#191c1e] tracking-tight mb-1">Command Center</h2>
          <p className="text-xs md:text-sm text-[#434655]">Real-time overview of civic intelligence.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ba1a1a] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ba1a1a]" />
          </span>
          <span className="text-xs font-semibold text-[#191c1e] hidden sm:inline">Live</span>
          <button onClick={refetch} className="p-1.5 rounded-full text-[#434655] hover:bg-[#e6e8ea] transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5">
        <IncidentStats stats={stats} incidents={incidents} />
      </div>

      {/* AI Insights */}
      <div className="mb-5 bg-white border border-[#c3c6d7] rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[#004ac6]" style={{ fontSize: '18px' }}>auto_awesome</span>
          <h3 className="text-sm font-semibold text-[#191c1e]">AI Insights</h3>
        </div>
        <div className="bg-[#dbe1ff]/30 rounded-lg p-3 border border-[#dbe1ff]">
          <p className="text-xs md:text-sm text-[#191c1e] leading-relaxed">
            <strong className="font-semibold text-[#004ac6]">System Status: </strong>
            {stats?.criticalIncidents > 0
              ? `${stats.criticalIncidents} critical incident${stats.criticalIncidents > 1 ? 's' : ''} require immediate attention. `
              : 'No critical incidents at this time. '}
            {stats?.totalIncidents > 0
              ? `Monitoring ${stats.totalIncidents} incident${stats.totalIncidents > 1 ? 's' : ''}.`
              : 'No active incidents.'}
          </p>
        </div>
      </div>

      {/* Incidents */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-sm overflow-hidden">
        {/* Header + filters */}
        <div className="px-4 py-3 border-b border-[#c3c6d7] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#191c1e]">Recent Incidents</h3>
            <button
              onClick={() => navigate('/submit')}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#004ac6] text-white text-xs font-semibold rounded-lg hover:bg-[#003ea8] transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
              Report
            </button>
          </div>
          {/* Severity filters — scrollable on mobile */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {SEVERITY_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setSeverityFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-colors flex-shrink-0 ${
                  severityFilter === f
                    ? 'bg-[#004ac6] text-white'
                    : 'bg-[#f2f4f6] text-[#434655] hover:bg-[#e6e8ea]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Spinner centered />
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-[#ba1a1a] mb-2">{error}</p>
            <button onClick={refetch} className="text-xs text-[#004ac6] hover:underline">Try again</button>
          </div>
        ) : incidents.length === 0 ? (
          <EmptyState icon="shield" title="No incidents found" message="Submit the first report to get started." />
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden divide-y divide-[#f2f4f6]">
              {incidents.map((incident) => (
                <MobileIncidentCard key={incident._id} incident={incident} />
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f4f6] border-b border-[#c3c6d7]">
                    {['ID','Title','Category','Severity','AI Confidence','Reports','Updated','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold text-[#434655] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e8ea]">
                  {incidents.map((incident) => (
                    <IncidentCard key={incident._id} incident={incident} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
