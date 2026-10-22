import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Upload, FolderOpen, Search,
  AlertTriangle, Settings, Shield, LogOut, FileText,
  HardDrive
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Document' },
  { to: '/documents', icon: FolderOpen, label: 'My Documents' },
  { to: '/search', icon: Search, label: 'Smart Search' },
  { to: '/expiring', icon: AlertTriangle, label: 'Expiring Soon' },
  { to: '/profile', icon: Settings, label: 'Profile & Settings' },
];

const adminItems = [
  { to: '/admin', icon: Shield, label: 'Admin Statistics' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="mobile-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Logo (click to replay intro animation) */}
        <div
          className="sidebar-logo"
          onClick={() => window.dispatchEvent(new CustomEvent('docuvault:replay-intro'))}
          title="Click to replay intro animation"
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="sidebar-logo-icon">
            <FileText size={22} color="#181818" strokeWidth={2.4} />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">DocuVault</span>
            <span className="sidebar-logo-tagline">College Document Vault</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Academic Portal</div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} className="nav-link-icon" />
              <span>{label}</span>
            </NavLink>
          ))}

          {user?.isAdmin && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: '0.85rem' }}>Administration</div>
              {adminItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <Icon size={18} className="nav-link-icon" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Storage / Cloud Status Widget */}
        <div className="sidebar-widget">
          <div className="sidebar-widget-header">
            <span className="sidebar-widget-title" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <HardDrive size={13} color="var(--lime-400)" /> S3 Vault
            </span>
            <span className="sidebar-widget-badge">ap-southeast-2</span>
          </div>
          <p className="sidebar-widget-desc">
            Encrypted storage bucket for student transcripts & credentials.
          </p>
          <div className="sidebar-meter">
            <div className="sidebar-meter-fill" style={{ width: '38%' }} />
          </div>
        </div>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="user-info-card" onClick={() => navigate('/profile')}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info-text">
              <div className="user-name">{user?.name || 'Student'}</div>
              <div className="user-email">{user?.email}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              className="btn btn-ghost btn-sm btn-icon"
              title="Sign Out"
              aria-label="Sign out"
              style={{ color: '#A0A0A0' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
