import { useState } from 'react';
import { isDemoMode } from '../api/client';
import { Cloud, Server, Database, Shield, X, CheckCircle, Info, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SystemStatusIndicator() {
  const [isOpen, setIsOpen] = useState(false);

  const region = import.meta.env.VITE_COGNITO_REGION || 'ap-southeast-2';
  const apiUrl = import.meta.env.VITE_API_URL || 'https://b4reqq8h9a.execute-api.ap-southeast-2.amazonaws.com';
  const s3Bucket = 'docuvault-storage-jainish';
  const dynamoTable = 'DocuVaultDocuments';
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

  const isCognitoConfigured = Boolean(userPoolId && clientId);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="system-indicator"
        title="Click to view AWS System Connectivity & Resources"
        aria-label="System status"
      >
        <span className={`system-indicator-dot ${isDemoMode ? 'demo' : 'live'}`} />
        <span>{isDemoMode ? 'Demo Mode' : 'AWS Live'}</span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          {isDemoMode ? 'Local Fallback' : 'ap-southeast-2'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="modal-overlay" onClick={() => setIsOpen(false)}>
            <motion.div
              className="modal"
              style={{ maxWidth: 540 }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      backgroundColor: isDemoMode ? 'var(--lime-subtle)' : 'var(--success-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDemoMode ? '#435405' : 'var(--success-solid)',
                      border: `1px solid ${isDemoMode ? 'var(--lime-border)' : 'var(--success-border)'}`,
                    }}
                  >
                    {isDemoMode ? <Server size={18} /> : <Cloud size={18} />}
                  </div>
                  <div>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>System Connectivity</h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      DocuVault cloud infrastructure status
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mode Banner */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: isDemoMode ? '#FAFBF3' : 'var(--success-bg)',
                  border: `1px solid ${isDemoMode ? 'var(--lime-border)' : 'var(--success-border)'}`,
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {isDemoMode ? (
                    <Info size={16} color="#586e08" />
                  ) : (
                    <CheckCircle size={16} color="var(--success-solid)" />
                  )}
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                  <strong style={{ color: isDemoMode ? '#2B3704' : 'var(--success-text)' }}>
                    {isDemoMode ? 'Operating in Demo Fallback Mode' : 'Connected to Live AWS Cloud'}
                  </strong>
                  <div style={{ color: isDemoMode ? '#4E5F11' : '#14532D', marginTop: '2px' }}>
                    {isDemoMode
                      ? 'Local in-memory simulated dataset is active. When live credentials are provided, live AWS API calls will run without mock fallback.'
                      : 'Live authentication & AWS API Gateway endpoints are actively engaged.'}
                  </div>
                </div>
              </div>

              {/* Resource Mapping Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface-workspace)',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border)',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <Cloud size={15} color="var(--charcoal-900)" /> AWS Region
                  </span>
                  <span className="badge badge-charcoal" style={{ fontFamily: 'var(--font-mono)' }}>
                    {region}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface-workspace)',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border)',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <Server size={15} color="var(--charcoal-900)" /> API Gateway HTTP API
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      color: 'var(--text-primary)',
                      maxWidth: '240px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={apiUrl}
                  >
                    b4reqq8h9a
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface-workspace)',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border)',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <HardDrive size={15} color="var(--charcoal-900)" /> S3 Storage Bucket
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-primary)' }}>
                    {s3Bucket}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface-workspace)',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border)',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <Database size={15} color="var(--charcoal-900)" /> DynamoDB Table
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-primary)' }}>
                    {dynamoTable}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--surface-workspace)',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border)',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <Shield size={15} color="var(--charcoal-900)" /> Cognito Auth Client
                  </span>
                  <span className={`badge ${isCognitoConfigured ? 'badge-processed' : 'badge-uploaded'}`}>
                    {isCognitoConfigured ? 'Configured' : 'Unconfigured'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsOpen(false)}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
