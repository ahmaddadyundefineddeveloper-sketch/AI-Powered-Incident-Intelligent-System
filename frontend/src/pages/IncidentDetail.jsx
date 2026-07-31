import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { toast } from 'sonner';
import useIncident from '../hooks/useIncident';
import { updateIncidentStatus } from '../api/incidents.api';
import Badge from '../components/ui/Badge';
import BriefingPanel from '../components/incident/BriefingPanel';
import Timeline from '../components/incident/Timeline';
import ReportList from '../components/incident/ReportList';
import ConfidenceMeter from '../components/ui/ConfidenceMeter';
import Spinner from '../components/ui/Spinner';
import { formatRelativeTime, formatDateTime, formatConfidence } from '../utils/formatters';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { incident, reports, timeline, briefing, briefingPending, loading, error, refetch } = useIncident(id);
  const [activeTab, setActiveTab] = useState('briefing');
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    if (!incident) return;
    const next = incident.status === 'resolved' ? 'active' : 'resolved';
    setResolving(true);
    try {
      await updateIncidentStatus(id, next);
      toast.success(`Incident marked as ${next}`);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <Spinner centered />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="material-symbols-outlined text-[#ba1a1a]" style={{ fontSize: '48px' }}>error</span>
        <p className="text-sm text-[#ba1a1a]">{error}</p>
        <button onClick={() => navigate('/')} className="text-xs text-[#004ac6] hover:underline">← Back to Dashboard</button>
      </div>
    );
  }

  if (!incident) return null;

  const TABS = [
    { id: 'briefing', label: 'AI Briefing', icon: 'psychology' },
    { id: 'reports', label: `Reports (${reports.length})`, icon: 'article' },
    { id: 'timeline', label: 'Timeline', icon: 'history' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto">

      {/* Page Header */}
      <div className="px-4 md:px-8 py-4 border-b border-[#c3c6d7] bg-white">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-[#434655] hover:text-[#004ac6] flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            Command Center
          </button>
          <span className="text-[#c3c6d7]">/</span>
          <span className="text-xs text-[#191c1e] font-semibold truncate max-w-xs">{incident.title}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="severity" value={incident.severity} />
              <Badge variant="status" value={incident.status} />
              {incident.confidence && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#d0e1fb] text-[#003ea8]">
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check_circle</span>
                  {formatConfidence(incident.confidence)} AI Confidence
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-[#191c1e] tracking-tight leading-tight">
              {incident.title}
            </h1>

            {incident.location?.text && (
              <p className="text-sm text-[#434655] flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
                {incident.location.text}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refetch}
              className="h-9 px-3 rounded-lg border border-[#c3c6d7] bg-white text-[#191c1e] text-xs font-semibold hover:bg-[#f2f4f6] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
              Refresh
            </button>
            <button
              onClick={handleResolve}
              disabled={resolving}
              className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                incident.status === 'resolved'
                  ? 'bg-[#eceef0] text-[#434655] hover:bg-[#e0e3e5]'
                  : 'bg-[#004ac6] text-white hover:bg-[#003ea8]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                {incident.status === 'resolved' ? 'undo' : 'check_circle'}
              </span>
              {resolving ? 'Updating…' : incident.status === 'resolved' ? 'Reopen' : 'Resolve Incident'}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 md:p-8 grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* Left — main content */}
        <div className="xl:col-span-7 flex flex-col gap-5">

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-[#c3c6d7]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? 'border-[#004ac6] text-[#004ac6]'
                    : 'border-transparent text-[#434655] hover:text-[#191c1e]'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'briefing' && (
            <div className="flex flex-col gap-5">
              <BriefingPanel briefing={briefing} briefingPending={briefingPending} loading={false} />

              {/* Recommended response */}
              {incident.recommendedResponse && (
                <section className="card p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-[#c3c6d7] pb-3">
                    <span className="material-symbols-outlined text-[#191c1e]" style={{ fontSize: '20px' }}>assignment_turned_in</span>
                    <h2 className="text-base font-semibold text-[#191c1e]">Recommended Response</h2>
                  </div>
                  <p className="text-sm text-[#191c1e] leading-relaxed">{incident.recommendedResponse}</p>
                </section>
              )}

              {/* Evidence gallery */}
              {reports.some(r => r.mediaAssets?.length > 0) && (
                <section className="card p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[#c3c6d7] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#191c1e]" style={{ fontSize: '20px' }}>photo_library</span>
                      <h2 className="text-base font-semibold text-[#191c1e]">Evidence Gallery</h2>
                    </div>
                    <span className="text-xs font-semibold text-[#434655]">
                      {reports.reduce((acc, r) => acc + (r.mediaAssets?.length || 0), 0)} Assets
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {reports.flatMap(r => r.mediaAssets || []).filter(a => a.url).slice(0, 6).map((asset, i) => (
                      <a
                        key={i}
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group overflow-hidden rounded border border-[#c3c6d7] h-36 block"
                      >
                        <img
                          src={asset.url}
                          alt={`Evidence ${i + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportList reports={reports} />
          )}

          {activeTab === 'timeline' && (
            <section className="card p-5">
              <div className="flex items-center gap-2 border-b border-[#c3c6d7] pb-3 mb-5">
                <span className="material-symbols-outlined text-[#191c1e]" style={{ fontSize: '20px' }}>history</span>
                <h2 className="text-base font-semibold text-[#191c1e]">Incident Timeline</h2>
                <span className="ml-auto text-xs text-[#434655]">{timeline.length} events</span>
              </div>
              <Timeline events={timeline} />
            </section>
          )}
        </div>

        {/* Right — sidebar */}
        <div className="xl:col-span-5 flex flex-col gap-5">

          {/* Map */}
          <section className="card overflow-hidden h-[280px] relative">
            {incident.location?.coordinates?.coordinates ? (
              (() => {
                const [lng, lat] = incident.location.coordinates.coordinates;
                return (
                  <MapContainer center={[lat, lng]} zoom={14} className="w-full h-full" zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[lat, lng]} />
                    <Circle center={[lat, lng]} radius={200} color="#004ac6" fillColor="#004ac6" fillOpacity={0.1} />
                  </MapContainer>
                );
              })()
            ) : (
              <div className="w-full h-full bg-[#eceef0] flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-[#737686]" style={{ fontSize: '32px' }}>location_off</span>
                  <p className="text-xs text-[#434655] mt-2">No location data</p>
                </div>
              </div>
            )}
          </section>

          {/* Inference Logic */}
          <section className="card p-5 flex flex-col gap-3 bg-[#f7f9fb]">
            <div className="flex items-center gap-2 border-b border-[#c3c6d7] pb-2">
              <span className="material-symbols-outlined text-[#505f76]" style={{ fontSize: '18px' }}>memory</span>
              <h3 className="text-[11px] font-semibold text-[#191c1e] uppercase tracking-wide">Inference Logic</h3>
            </div>
            <p className="text-xs text-[#434655] leading-relaxed">
              {briefing
                ? `AI merged ${reports.length} report${reports.length > 1 ? 's' : ''} based on spatial proximity and semantic similarity. Confidence: ${formatConfidence(incident.confidence)}.`
                : 'AI pipeline is processing incoming reports. Inference data will appear once analysis is complete.'}
            </p>
            <div className="bg-white border border-[#c3c6d7] rounded-lg p-3 flex flex-col gap-2">
              <ConfidenceMeter value={incident.confidence} label="Model Confidence" />
              <div className="flex gap-2 flex-wrap mt-1">
                {incident.category && (
                  <span className="px-2 py-0.5 bg-[#eceef0] text-[#434655] rounded text-[10px] font-mono border border-[#c3c6d7]">
                    Category: {incident.category}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-[#eceef0] text-[#434655] rounded text-[10px] font-mono border border-[#c3c6d7]">
                  Reports: {incident.reportCount || reports.length}
                </span>
              </div>
            </div>
          </section>

          {/* Meta */}
          <section className="card p-5 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-[#191c1e] uppercase tracking-wide border-b border-[#c3c6d7] pb-2">Incident Details</h3>
            <dl className="space-y-2.5">
              {[
                { label: 'Status', value: <Badge variant="status" value={incident.status} /> },
                { label: 'Severity', value: <Badge variant="severity" value={incident.severity} /> },
                { label: 'Category', value: <Badge variant="category" value={incident.category} /> },
                { label: 'Report Count', value: incident.reportCount || reports.length },
                { label: 'Created', value: formatRelativeTime(incident.createdAt) },
                { label: 'Last Updated', value: formatRelativeTime(incident.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <dt className="text-xs text-[#434655] font-semibold">{label}</dt>
                  <dd className="text-xs text-[#191c1e] text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Mini Timeline in sidebar */}
          <section className="card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#c3c6d7] pb-3">
              <span className="material-symbols-outlined text-[#191c1e]" style={{ fontSize: '18px' }}>history</span>
              <h2 className="text-base font-semibold text-[#191c1e]">Timeline</h2>
            </div>
            <Timeline events={timeline.slice(0, 5)} />
            {timeline.length > 5 && (
              <button
                onClick={() => setActiveTab('timeline')}
                className="text-xs text-[#004ac6] hover:underline text-center"
              >
                View all {timeline.length} events →
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
