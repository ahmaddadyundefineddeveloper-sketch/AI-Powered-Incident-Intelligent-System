import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ onMenuClick }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f2f4f6] border-b border-[#c3c6d7] flex items-center h-14 px-4 md:px-8 gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-[#434655] hover:bg-[#e6e8ea] transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>menu</span>
      </button>

      {/* Search */}
      <div className="flex-1 relative min-w-0">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#434655]" style={{ fontSize: '16px' }}>
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search incidents..."
          className="w-full bg-white border border-[#c3c6d7] text-[#191c1e] text-sm rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#004ac6] transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => navigate('/submit')}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#004ac6] text-white text-xs font-semibold rounded-lg hover:bg-[#003ea8] transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          <span className="hidden sm:inline">Report</span>
        </button>
        <button className="p-2 rounded-full text-[#434655] hover:text-[#004ac6] hover:bg-[#e6e8ea] transition-colors hidden sm:flex">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
        </button>
      </div>
    </header>
  );
}
