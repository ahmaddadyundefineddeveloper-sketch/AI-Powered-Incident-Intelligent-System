import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const NAV_ITEMS = [
  { icon: 'dashboard',  label: 'Command Center',    to: '/',     end: true,  available: true },
  { icon: 'list_alt',   label: 'Incident Feed',      to: '/feed', end: true,  available: true },
  { icon: 'map',        label: 'Intelligence Maps',  to: '/map',  end: true,  available: true },
  { icon: 'analytics',  label: 'Risk Analytics',     to: null,    available: false },
  { icon: 'history',    label: 'Archive',            to: '/?status=resolved', end: false, available: true },
];

const BOTTOM_ITEMS = [
  { icon: 'settings',     label: 'Settings', available: false },
  { icon: 'help_outline', label: 'Support',  available: false },
];

function NavItem({ item, onClose }) {
  if (!item.available) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-[#c3c6d7] cursor-not-allowed select-none">
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
        {item.label}
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#eceef0] text-[#737686]">Soon</span>
      </div>
    );
  }

  if (item.to?.includes('?')) {
    return (
      <NavLink to={item.to} onClick={onClose}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-[#434655] hover:bg-[#e6e8ea] transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
        {item.label}
      </NavLink>
    );
  }

  return (
    <NavLink to={item.to} end={item.end} onClick={onClose}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors',
        isActive
          ? 'bg-[#d0e1fb] text-[#003ea8] border-l-4 border-[#004ac6]'
          : 'text-[#434655] hover:bg-[#e6e8ea]'
      )}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
      {item.label}
    </NavLink>
  );
}

export default function Sidebar({ onClose }) {
  const navigate = useNavigate();

  const handleNav = (fn) => {
    fn();
    onClose?.();
  };

  return (
    <nav className="bg-white border-r border-[#c3c6d7] w-[260px] h-screen flex flex-col p-4">
      {/* Brand + mobile close */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-9 h-9 rounded-lg bg-[#004ac6] flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
            radar
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[#004ac6] text-sm tracking-tight leading-none">CivicLens</h1>
          <p className="text-[11px] text-[#434655] mt-0.5">Community Intelligence</p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded-lg text-[#434655] hover:bg-[#e6e8ea]">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        )}
      </div>

      {/* Report button */}
      <button
        onClick={() => handleNav(() => navigate('/submit'))}
        className="bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs font-semibold rounded-lg py-3 px-4 mb-5 w-full flex items-center justify-center gap-2 transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>add</span>
        Report Incident
      </button>

      {/* Nav */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.label} item={item} onClose={onClose} />
        ))}
      </div>

      {/* Bottom */}
      <div className="border-t border-[#c3c6d7] pt-3 flex flex-col gap-1">
        {BOTTOM_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-[#c3c6d7] cursor-not-allowed">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
            {item.label}
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#eceef0] text-[#737686]">Soon</span>
          </div>
        ))}
      </div>
    </nav>
  );
}
