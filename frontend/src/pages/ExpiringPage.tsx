import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDocuments } from '../api/client';
import type { Document } from '../demo/demoStore';
import { getDocTypeInfo, formatDate, getExpiryStatus } from '../utils/docUtils';
import { AlertTriangle, Clock, CheckCircle2, Bell, ChevronRight, ShieldAlert } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

function DocRow({ doc, onView }: { doc: Document; onView: (id: string) => void }) {
  const info = getDocTypeInfo(doc.document_type);
  const exp = getExpiryStatus(doc.expiry_date);
  return (
    <div className="doc-card" onClick={() => onView(doc.document_id)}>
      <div className="doc-icon">
        {info.emoji}
      </div>
      <div className="doc-meta">
        <div className="doc-name">{doc.file_name}</div>
        {doc.title && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
            {doc.title}
          </div>
        )}
        <div className="doc-info">
          <span className={`badge ${info.badgeClass}`}>{info.label}</span>
          {doc.issuer && <span className="doc-info-item">🏛️ {doc.issuer}</span>}
          <span className="doc-info-item">
            <Clock size={12} /> Expiry: {formatDate(doc.expiry_date)}
          </span>
          <span className={`badge ${exp.badgeClass}`}>{exp.label}</span>
        </div>
      </div>
      <div className="doc-actions">
        <button
          className="btn btn-ghost btn-sm btn-icon"
          onClick={e => { e.stopPropagation(); onView(doc.document_id); }}
          title="View document details"
          aria-label="View document details"
        >
          <ChevronRight size={18} color="var(--charcoal-900)" />
        </button>
      </div>
    </div>
  );
}

function Section({
  title, docs, color, icon, onView,
}: { title: string; docs: Document[]; color: string; icon: React.ReactNode; onView: (id: string) => void }) {
  if (docs.length === 0) return null;
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="section-title" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color }}>{icon}</span>
        <span>{title}</span>
        <span className="badge badge-charcoal" style={{ fontSize: '0.68rem', marginLeft: '0.35rem' }}>
          {docs.length}
        </span>
      </div>
      <div className="grid-docs">
        {docs.map(d => <DocRow key={d.document_id} doc={d} onView={onView} />)}
      </div>
    </div>
  );
}

export default function ExpiringPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    fetchDocuments()
      .then(docs => {
        const withExpiry = docs.filter(d => d.expiry_date);
        setAllDocs(withExpiry);
      })
      .catch(e => setError(e.response?.data?.error || e.message || 'Failed to load expiring documents'))
      .finally(() => setIsLoading(false));
  }, []);

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const expired = allDocs.filter(d => d.expiry_date && new Date(d.expiry_date) < now);
  const soonExpiring = allDocs.filter(d => {
    if (!d.expiry_date) return false;
    const exp = new Date(d.expiry_date);
    return exp >= now && exp <= thirtyDays;
  });
  const upcoming = allDocs.filter(d => {
    if (!d.expiry_date) return false;
    const exp = new Date(d.expiry_date);
    return exp > thirtyDays && exp <= ninetyDays;
  });
  const valid = allDocs.filter(d => d.expiry_date && new Date(d.expiry_date) > ninetyDays);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <AlertTriangle size={24} color="var(--warning-solid)" />
            Expiring Documents & Credential Deadlines
          </h1>
          <p className="page-subtitle">
            Automated monitoring for student certifications, driver licenses, visas, and university enrollments
          </p>
        </div>
      </header>

      <div className="page-body">
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Summary Stat Cards */}
        <div className="grid-stats" style={{ marginBottom: '2rem' }}>
          <motion.div className="stat-card" whileHover={shouldReduceMotion ? {} : { y: -2 }}>
            <div>
              <div className="stat-value">{isLoading ? '—' : expired.length}</div>
              <div className="stat-label">Already Expired</div>
              <div className="stat-meta">
                <span className="badge badge-expired" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Urgent Action</span>
              </div>
            </div>
            <div className="stat-icon danger"><AlertTriangle size={20} /></div>
          </motion.div>

          <motion.div className="stat-card stat-card-accent-lime" whileHover={shouldReduceMotion ? {} : { y: -2 }}>
            <div>
              <div className="stat-value">{isLoading ? '—' : soonExpiring.length}</div>
              <div className="stat-label">Expiring in 30 Days</div>
              <div className="stat-meta">
                <span className="badge badge-expiring" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Within 30d</span>
              </div>
            </div>
            <div className="stat-icon warning"><Clock size={20} /></div>
          </motion.div>

          <motion.div className="stat-card" whileHover={shouldReduceMotion ? {} : { y: -2 }}>
            <div>
              <div className="stat-value">{isLoading ? '—' : upcoming.length}</div>
              <div className="stat-label">Expiring in 90 Days</div>
              <div className="stat-meta">
                <span className="badge badge-uploaded" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Upcoming</span>
              </div>
            </div>
            <div className="stat-icon brand"><Clock size={20} /></div>
          </motion.div>

          <motion.div className="stat-card" whileHover={shouldReduceMotion ? {} : { y: -2 }}>
            <div>
              <div className="stat-value">{isLoading ? '—' : valid.length}</div>
              <div className="stat-label">Valid Beyond 90 Days</div>
              <div className="stat-meta">
                <span className="badge badge-processed" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Secure</span>
              </div>
            </div>
            <div className="stat-icon success"><CheckCircle2 size={20} /></div>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner spinner-lg" />
            <span>Scanning credential expiration dates...</span>
          </div>
        ) : allDocs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">No expiring documents found</div>
            <p className="empty-state-subtitle">
              Documents with validity dates will be tracked automatically here.
            </p>
          </div>
        ) : (
          <div>
            <Section
              title="Expired Credentials"
              docs={expired}
              color="var(--danger-solid)"
              icon={<AlertTriangle size={18} />}
              onView={id => navigate(`/documents/${id}`)}
            />
            <Section
              title="Expiring Within 30 Days"
              docs={soonExpiring}
              color="var(--warning-solid)"
              icon={<Clock size={18} />}
              onView={id => navigate(`/documents/${id}`)}
            />
            <Section
              title="Expiring Within 90 Days"
              docs={upcoming}
              color="var(--charcoal-900)"
              icon={<Clock size={18} />}
              onView={id => navigate(`/documents/${id}`)}
            />
            <Section
              title="Valid (Beyond 90 Days)"
              docs={valid}
              color="var(--success-solid)"
              icon={<CheckCircle2 size={18} />}
              onView={id => navigate(`/documents/${id}`)}
            />
          </div>
        )}

        {/* AWS SNS Notification Banner */}
        <div
          className="card"
          style={{
            marginTop: '2rem',
            backgroundColor: '#FAFBF3',
            border: '1px solid var(--lime-border)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '8px',
              backgroundColor: 'var(--lime-400)',
              color: 'var(--charcoal-900)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bell size={18} />
          </div>
          <div>
            <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              Automated AWS EventBridge & SNS Expiry Dispatcher
            </strong>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              The backend microservice <code style={{ fontFamily: 'var(--font-mono)' }}>sendExpiryNotifications</code> scans
              active records in DynamoDB <code style={{ fontFamily: 'var(--font-mono)' }}>DocuVaultDocuments</code> daily and publishes
              email notifications to the student email 30 days prior to expiry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
