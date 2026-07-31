import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import useIncidents from '../hooks/useIncidents';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { formatRelativeTime } from '../utils/formatters';

// Severity colours
const SEVERITY_COLORS = {
  critical: '#ba1a1a',
  high:     '#943700',
  medium:   '#f59e0b',
  low:      '#505f76',
};

// Custom div-icon per severity
const makeIcon = (color, isCritical = false) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:${isCritical ? 18 : 14}px;
      height:${isCritical ? 18 : 14}px;
      border-radius:50%;
      background:${color};
      border:2.5px solid white;
      box-shadow:0 1px 6px rgba(0,0,0,0.45);
      ${isCritical ? `animation:pulse-map 1.8s ease-in-out infinite;` : ''}
    "></div>
    <style>
      @keyframes pulse-map {
        0%,100%{box-shadow:0 0 0 0 ${color}66;}
        50%{box-shadow:0 0 0 7px ${color}00;}
      }
    </style>`,
    iconSize: [isCritical ? 18 : 14, isCritical ? 18 : 14],
    iconAnchor: [isCritical ? 9 : 7, isCritical ? 9 : 7],
    popupAnchor: [0, -12],
  });

// Fits map to bounds of all markers, or flies to a single point
function MapController({ bounds, flyTo }) {
  const map = useMap();
  const fittedRef = useRef(false);

  // Auto-fit on first load
  useEffect(() => {
    if (fittedRef.current || !bounds || bounds.length === 0) return;
    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
    fittedRef.current = true;
  }, [map, bounds]);

  // Fly to a specific incident when clicked from sidebar
  useEffect(() => {
    if (flyTo) map.flyTo(flyTo, 15, { duration: 1.0 });
  }, [map, flyTo]);

  return null;
}

export default function IntelligenceMap() {
  const navigate = useNavigate();
  const { incidents, stats, loading, error, refetch } = useIncidents({ limit: 200 });
  const [flyTarget, setFlyTarget] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const mapRef = useRef(null);

  // Only incidents with valid coordinates
  const mapped = incidents.filter(
    (i) => i.location?.coordinates?.coordinates?.length === 2
  );

  // Bounds array for auto-fit
  const bounds = mapped.map((i) => {
    const [lng, lat] = i.location.coordinates.coordinates;
    return [lat, lng];
  });

  // Fly to an incident from the sidebar
  const handleSidebarClick = (incident) => {
    const [lng, lat] = incident.location.coordinates.coordinates;
    setFlyTarget([lat, lng]);
    setActiveId(incident._id);
  };

  // "Fit all" button resets the view
  const handleFitAll = () => {
    setFlyTarget(null);
    setActiveId(null);
    // Trigger re-fit by remounting MapController trick — just fly to bounds center
    if (bounds.length === 1) {
      setFlyTarget(bounds[0]);
    } else if (bounds.length > 1) {
      const lats = bounds.map((b) => b[0]);
      const lngs = bounds.map((b) => b[1]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      setFlyTarget([centerLat, centerLng]);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#191c1e] tracking-tight mb-1">Intelligence Maps</h2>
          <p className="text-xs md:text-sm text-[#434655]">
            Geographic view of all active incidents.
            {mapped.length > 0 && (
              <span className="ml-1 text-[#004ac6] font-semibold">
                {mapped.length} plotted
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {mapped.length > 1 && (
            <button
              onClick={handleFitAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#c3c6d7] text-xs font-semibold text-[#434655] rounded-lg hover:bg-[#f2f4f6] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fit_screen</span>
              Fit All
            </button>
          )}
          <button
            onClick={refetch}
            className="p-2 rounded-full text-[#434655] hover:bg-[#e6e8ea] hover:text-[#004ac6] transition-colors"
            title="Refresh"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
          </button>
        </div>
      </div>

      {/* Stats strip — scrollable on mobile */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'Active',   value: stats?.activeIncidents   ?? '—', color: 'text-[#004ac6]' },
          { label: 'Critical', value: stats?.criticalIncidents ?? '—', color: 'text-[#ba1a1a]' },
          { label: 'Resolved', value: stats?.resolvedIncidents ?? '—', color: 'text-[#16a34a]' },
          { label: 'Reports',  value: stats?.totalReports      ?? '—', color: 'text-[#434655]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#c3c6d7] rounded-lg px-3 py-2 flex items-center gap-1.5 shadow-sm flex-shrink-0">
            <span className={`text-base font-bold ${color}`}>{value}</span>
            <span className="text-[11px] text-[#434655] font-semibold">{label}</span>
          </div>
        ))}
        {/* Legend — hidden on mobile */}
        <div className="ml-auto hidden sm:flex items-center gap-2 bg-white border border-[#c3c6d7] rounded-lg px-3 py-2 shadow-sm flex-shrink-0">
          {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
            <div key={sev} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px] font-semibold text-[#434655] capitalize">{sev}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid — stacks on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Map */}
        <div className="lg:col-span-2 bg-white border border-[#c3c6d7] rounded-xl shadow-sm overflow-hidden"
          style={{ height: '400px' }}>
          {loading ? (
            <Spinner centered />
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-sm text-[#ba1a1a]">{error}</p>
              <button onClick={refetch} className="text-xs text-[#004ac6] hover:underline">Retry</button>
            </div>
          ) : mapped.length === 0 ? (
            <EmptyState
              icon="map"
              title="No incidents with location data"
              message="Submit reports with a location to see them plotted here."
            />
          ) : (
            <MapContainer
              center={[20, 20]}
              zoom={3}
              className="w-full h-full"
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* Auto-fit + fly-to controller */}
              <MapController bounds={bounds} flyTo={flyTarget} />

              {/* Clustered markers */}
              <MarkerClusterGroup
                chunkedLoading
                showCoverageOnHover={false}
                maxClusterRadius={50}
              >
                {mapped.map((incident) => {
                  const [lng, lat] = incident.location.coordinates.coordinates;
                  const color = SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.low;
                  const isCritical = incident.severity === 'critical';
                  return (
                    <Marker
                      key={incident._id}
                      position={[lat, lng]}
                      icon={makeIcon(color, isCritical)}
                    >
                      <Popup minWidth={220}>
                        <div className="py-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                              style={{ background: color + '22', color }}
                            >
                              {incident.severity}
                            </span>
                            <span className="text-[10px] text-gray-400 capitalize">{incident.status}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 leading-snug mb-1">
                            {incident.title}
                          </p>
                          {incident.location?.text && (
                            <p className="text-xs text-gray-500 mb-1">{incident.location.text}</p>
                          )}
                          <p className="text-[11px] text-gray-400 mb-3">
                            {formatRelativeTime(incident.updatedAt)}
                            {incident.reportCount > 1 && ` · ${incident.reportCount} reports`}
                          </p>
                          <button
                            onClick={() => navigate(`/incidents/${incident._id}`)}
                            className="w-full bg-[#004ac6] text-white text-xs font-semibold rounded-lg py-2 hover:bg-[#003ea8] transition-colors"
                          >
                            View Incident →
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            </MapContainer>
          )}
        </div>

        {/* Sidebar incident list */}
        <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-sm flex flex-col overflow-hidden"
          style={{ height: '350px' }}>
          <div className="px-4 py-3 border-b border-[#c3c6d7] flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-semibold text-[#191c1e]">All Incidents</h3>
            <span className="text-xs text-[#434655]">{incidents.length} total</span>
          </div>

          {loading ? (
            <Spinner centered />
          ) : incidents.length === 0 ? (
            <EmptyState icon="shield" title="No incidents" />
          ) : (
            <div className="overflow-y-auto flex-1 divide-y divide-[#f2f4f6]">
              {incidents.map((incident) => {
                const hasLocation = incident.location?.coordinates?.coordinates?.length === 2;
                const color = SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.low;
                const isActive = activeId === incident._id;

                return (
                  <button
                    key={incident._id}
                    onClick={() => {
                      if (hasLocation) {
                        handleSidebarClick(incident);
                      } else {
                        navigate(`/incidents/${incident._id}`);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 ${
                      isActive
                        ? 'bg-[#dbe1ff]'
                        : 'hover:bg-[#f2f4f6]'
                    }`}
                  >
                    {/* Severity dot */}
                    <div
                      className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#191c1e] truncate">{incident.title}</p>
                      {incident.location?.text ? (
                        <p className="text-[11px] text-[#737686] truncate mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>location_on</span>
                          {incident.location.text}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#c3c6d7] mt-0.5 italic">No location</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="category" value={incident.category} />
                        <span className="text-[10px] text-[#737686]">{formatRelativeTime(incident.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Action icon */}
                    <span
                      className="material-symbols-outlined text-[#c3c6d7] flex-shrink-0 mt-0.5"
                      style={{ fontSize: '16px' }}
                    >
                      {hasLocation ? 'my_location' : 'open_in_new'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
