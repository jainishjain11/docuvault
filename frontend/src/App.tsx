import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import SearchPage from './pages/SearchPage';
import ExpiringPage from './pages/ExpiringPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import StartupAnimation from './components/StartupAnimation';

export default function App() {
  const [showStartup, setShowStartup] = useState(true);

  // Allow replaying intro animation via custom event or global helper
  useEffect(() => {
    const handleReplay = () => setShowStartup(true);
    window.addEventListener('docuvault:replay-intro', handleReplay);

    // Provide global helper for developer testing in browser console
    (window as any).__replayDocuVaultIntro = handleReplay;

    return () => {
      window.removeEventListener('docuvault:replay-intro', handleReplay);
      delete (window as any).__replayDocuVaultIntro;
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {showStartup && (
          <StartupAnimation
            duration={2100}
            onComplete={() => setShowStartup(false)}
          />
        )}
      </AnimatePresence>

      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="documents/:documentId" element={<DocumentDetailPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="expiring" element={<ExpiringPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
