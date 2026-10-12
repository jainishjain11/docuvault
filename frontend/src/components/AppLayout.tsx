import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { Menu, FileText } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', backgroundColor: 'var(--surface-workspace)' }}>
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <span style={{ color: 'var(--text-secondary)' }}>Loading DocuVault...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Mobile Header */}
        <div
          style={{
            display: 'none',
            padding: '0.85rem 1.25rem',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--surface-border)',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          className="mobile-header"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: 'var(--lime-400)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={16} color="#181818" strokeWidth={2.4} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                DocuVault
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Top Header Bar */}
        <TopHeader onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Animated Page Outlet */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
