import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import { formatRelativeTime } from '../../utils/formatters';

export default function MobileIncidentCard({ incident }) {
  const navigate = useNavigate();
  if (!incident) return null;

  return (
    <div
      onClick={() => navigate(`/incidents/${incident._id}`)}
      className="px-4 py-3 hover:bg-[#f7f9fb] active:bg-[#f2f4f6] transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold text-[#191c1e] line-clamp-2 flex-1">
          {incident.title || 'Untitled Incident'}
        </p>
        <span className="material-symbols-outlined text-[#c3c6d7] flex-shrink-0 mt-0.5" style={{ fontSize: '16px' }}>
          chevron_right
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-1">
        <Badge variant="severity" value={incident.severity} />
        <Badge variant="category" value={incident.category} />
      </div>

      <div className="flex items-center gap-3 text-[11px] text-[#737686]">
        {incident.location?.text && (
          <span className="flex items-center gap-0.5 truncate max-w-[160px]">
            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>location_on</span>
            {incident.location.text}
          </span>
        )}
        <span>{incident.reportCount || 0} reports</span>
        <span className="ml-auto">{formatRelativeTime(incident.updatedAt)}</span>
      </div>
    </div>
  );
}
