import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { isDemoMode } from '../api/client';
import { Settings, LogOut, Shield, Bell, Database, Cloud, Server, HardDrive } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const region = import.meta.env.VITE_COGNITO_REGION || 'ap-southeast-2';
  const apiUrl = import.meta.env.VITE_API_URL || 'https://b4reqq8h9a.execute-api.ap-southeast-2.amazonaws.com';
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <Settings size={24} color="var(--charcoal-900)" />
            Profile & Cloud Environment
          </h1>
          <p className="page-subtitle">
            Student account credentials, AWS service bindings, and storage preferences
          </p>
        </div>
      </header>

      <div className="page-body" style={{ maxWidth: 780 }}>
        {/* Profile User Card */}
        <motion.div
          className="card"
          style={{ marginBottom: '1.5rem' }}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 64,
                height: 64,
                backgroundColor: 'var(--lime-400)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--charcoal-900)',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              {initials}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {user?.name || 'Student Account'}
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '6px' }}>
                {user?.isAdmin && (
                  <span className="badge badge-charcoal">
                    <Shield size={11} /> Admin Role
                  </span>
                )}
                <span className="badge badge-lime">Student Vault</span>
                <span className="badge badge-uploaded">{user?.userId}</span>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Active Session Token: Secure JWT Handshake
            </span>
            <button className="btn btn-danger btn-sm" onClick={handleLogout} id="btn-logout">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </motion.div>

        {/* Cloud Mode Card */}
        <motion.div
          className="card"
          style={{
            marginBottom: '1.5rem',
            backgroundColor: isDemoMode ? '#FAFBF3' : 'var(--success-bg)',
            border: `1px solid ${isDemoMode ? 'var(--lime-border)' : 'var(--success-border)'}`,
          }}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: isDemoMode ? 'var(--lime-400)' : '#FFFFFF',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--charcoal-900)',
                flexShrink: 0,
              }}
            >
              {isDemoMode ? <Server size={20} /> : <Cloud size={20} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {isDemoMode ? 'Operating Mode: Demo Fallback (Local)' : 'Operating Mode: Production AWS Integration'}
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isDemoMode
                  ? 'The app is using verified local simulated data for zero-cost testing. To connect directly to your live deployed backend in ap-southeast-2, configure Cognito credentials in .env.'
                  : 'Connected directly to deployed API Gateway, DynamoDB table, and S3 bucket in ap-southeast-2. All document operations execute live on AWS.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* AWS Backend Service Mapping Card */}
        <motion.div
          className="card"
          style={{ marginBottom: '1.5rem' }}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <div className="section-title">
            <Cloud size={18} color="var(--charcoal-900)" />
            Deployed AWS Resource Configuration
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              {
                icon: <Cloud size={16} />,
                title: 'AWS Region',
                desc: 'Target Cloud Deployment Data Center',
                value: region,
                isMono: true,
              },
              {
                icon: <Server size={16} />,
                title: 'API Gateway HTTP API',
                desc: 'REST Microservices Endpoint',
                value: apiUrl,
                isMono: true,
              },
              {
                icon: <HardDrive size={16} />,
                title: 'Amazon S3 Bucket',
                desc: 'Encrypted Document Object Store',
                value: 'docuvault-storage-jainish',
                isMono: true,
              },
              {
                icon: <Database size={16} />,
                title: 'Amazon DynamoDB Table',
                desc: 'Partition Key: user_id, Sort Key: document_id',
                value: 'DocuVaultDocuments',
                isMono: true,
              },
              {
                icon: <Shield size={16} />,
                title: 'Amazon Cognito User Pool',
                desc: 'Native Student Authentication Pool',
                value: userPoolId ? userPoolId : 'Configurable via VITE_COGNITO_USER_POOL_ID',
                isMono: false,
              },
              {
                icon: <Bell size={16} />,
                title: 'Amazon SNS Notifications',
                desc: '30-Day Credential Expiry Email Dispatcher',
                value: 'Configured via CloudWatch Daily Cron Schedule',
                isMono: false,
              },
            ].map(({ icon, title, desc, value, isMono }) => (
              <div
                key={title}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--surface-workspace)',
                  borderRadius: '10px',
                  border: '1px solid var(--surface-border)',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: 'var(--charcoal-900)' }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontFamily: isMono ? 'var(--font-mono)' : 'inherit',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
