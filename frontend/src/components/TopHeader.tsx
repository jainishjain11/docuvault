import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SystemStatusIndicator from './SystemStatusIndicator';
import { Search, Upload, Menu } from 'lucide-react';

interface TopHeaderProps {
  onOpenSidebar: () => void;
}

export default function TopHeader({ onOpenSidebar }: TopHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <header className="top-header">
      {/* Mobile Burger */}
      <button
        className="btn btn-ghost btn-icon mobile-header-btn"
        style={{ display: 'none' }}
        onClick={onOpenSidebar}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Global Quick Search */}
      <form onSubmit={handleSearchSubmit} className="top-header-search">
        <Search size={16} className="top-header-search-icon" />
        <input
          type="text"
          className="top-header-search-input"
          placeholder="Search transcripts, certs, documents..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
        <span className="top-header-shortcut">↵ Enter</span>
      </form>

      {/* Right Actions */}
      <div className="top-header-actions">
        {/* Connected System Indicator */}
        <SystemStatusIndicator />

        {/* Quick Upload Action */}
        <button
          className="btn btn-lime btn-sm"
          onClick={() => navigate('/upload')}
          id="btn-top-upload"
        >
          <Upload size={14} />
          <span>Upload</span>
        </button>

        {/* User Profile Pill */}
        <div
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.35rem 0.65rem 0.35rem 0.4rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--surface-workspace)',
            border: '1px solid var(--surface-border)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          title="View profile & settings"
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: 'var(--charcoal-900)',
              color: 'var(--lime-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.72rem',
            }}
          >
            {initials}
          </div>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.name?.split(' ')[0] || 'Student'}
          </span>
          {user?.isAdmin && (
            <span className="badge badge-charcoal" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
              Admin
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
