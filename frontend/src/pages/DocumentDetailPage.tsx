import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDocument, deleteDocument, retryProcessing } from '../api/client';
import type { Document } from '../demo/demoStore';
import {
  getDocTypeInfo, getStatusBadgeClass, getStatusLabel,
  formatDate, getExpiryStatus, getConfidenceLevel,
} from '../utils/docUtils';
import {
  ArrowLeft, Download, Trash2, RefreshCw, AlertCircle,
  Calendar, Building2, User, Tag, Zap,
  FileText, Clock, CheckCircle2, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [doc, setDoc] = useState<(Document & { download_url?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMsg, setRetryMsg] = useState('');
  const [isRetryError, setIsRetryError] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    setIsLoading(true);
    setError('');
    fetchDocument(documentId)
      .then(setDoc)
      .catch(e => setError(e.response?.data?.error || e.message || 'Failed to load document'))
      .finally(() => setIsLoading(false));
  }, [documentId]);

  const handleDelete = async () => {
    if (!doc) return;
    setIsDeleting(true);
    try {
      await deleteDocument(doc.document_id);
      navigate('/documents');
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
      setIsDeleting(false);
    }
  };

  const handleRetry = async () => {
    if (!doc) return;
    setIsRetrying(true);
    setRetryMsg('');
    setIsRetryError(false);
    try {
      await retryProcessing(doc.document_id);
      setIsRetryError(false);
      setRetryMsg('Processing re-queued. Status will update shortly.');
      setDoc(prev => prev ? { ...prev, processing_status: 'PROCESSING' } : prev);
    } catch (e: any) {
      setIsRetryError(true);
      setRetryMsg(e.message || 'Failed to retry processing');
    } finally {
      setIsRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-state" style={{ minHeight: 400 }}>
        <div className="spinner spinner-lg" />
        <span>Loading document details...</span>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="page-body">
        <div className="alert alert-danger" style={{ marginTop: '2rem' }}>
          <AlertCircle size={18} />
          <div>{error || 'Document not found in storage'}</div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/documents')} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={14} /> Back to My Documents
        </button>
      </div>
    );
  }

  const info = getDocTypeInfo(doc.document_type);
  const exp = getExpiryStatus(doc.expiry_date);
  const confLevel = getConfidenceLevel(doc.processing_confidence);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Header */}
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            className="btn btn-secondary btn-sm btn-icon"
            onClick={() => navigate('/documents')}
            title="Back to vault"
            aria-label="Back to documents"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.25rem' }}>
              {doc.title || doc.file_name}
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {doc.document_id} · S3 Encrypted
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
          {doc.download_url && (
            <a
              href={doc.download_url}
              className="btn btn-lime btn-sm"
              target="_blank"
              rel="noopener noreferrer"
              id="btn-download-doc"
            >
              <Download size={14} /> Download File
            </a>
          )}
          {doc.processing_status === 'PROCESSING_FAILED' && (
            <button className="btn btn-secondary btn-sm" onClick={handleRetry} disabled={isRetrying}>
              <RefreshCw size={14} className={isRetrying ? 'spinner' : ''} />
              <span>Retry OCR</span>
            </button>
          )}
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setDeleteConfirm(true)}
            id="btn-delete-doc"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </header>

      <div className="page-body">
        {retryMsg && (
          <div className={`alert ${isRetryError ? 'alert-warning' : 'alert-success'}`} style={{ marginBottom: '1.25rem' }}>
            {isRetryError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{retryMsg}</span>
          </div>
        )}

        <div className="grid-2">
          {/* Left Column: Metadata & AI Classification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Overview Card */}
            <motion.div
              className="card"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div className="doc-icon" style={{ width: 56, height: 56, fontSize: '1.8rem' }}>
                  {info.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {doc.file_name}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    <span className={`badge ${getStatusBadgeClass(doc.processing_status)}`}>
                      {getStatusLabel(doc.processing_status)}
                    </span>
                    <span className={`badge ${info.badgeClass}`}>{info.label}</span>
                    {exp.status !== 'none' && (
                      <span className={`badge ${exp.badgeClass}`}>{exp.label}</span>
                    )}
                  </div>
                </div>
              </div>

              {doc.processing_status === 'PROCESSING_FAILED' && (
                <div className="alert alert-warning" style={{ marginTop: '0.5rem' }}>
                  <AlertCircle size={16} />
                  <div>
                    <strong>Automated Extraction Incomplete</strong>
                    <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                      The file is safely persisted in S3, but Textract entity classification was unable to parse all text fields.
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Extracted Attributes Card */}
            <motion.div
              className="card"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="section-title">
                <Tag size={17} color="var(--charcoal-900)" />
                Extracted Academic Information
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {[
                  { icon: <FileText size={16} />, label: 'Document Classification', value: info.label },
                  { icon: <User size={16} />, label: 'Student / Bearer Name', value: doc.person_name },
                  { icon: <Building2 size={16} />, label: 'Issuing Institution / University', value: doc.issuer },
                  { icon: <Calendar size={16} />, label: 'Date of Issue', value: formatDate(doc.issue_date) },
                  { icon: <Calendar size={16} />, label: 'Credential Expiry Date', value: doc.expiry_date ? formatDate(doc.expiry_date) : null },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: value ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '2px' }}>
                        {value || 'Not detected'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Processing Metrics, AWS Storage & Skills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* AI Confidence & Verification Card */}
            <motion.div
              className="card"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <div className="section-title">
                <Zap size={17} color="var(--charcoal-900)" />
                AI Verification & Confidence
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Classification Accuracy</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      {Math.round(doc.processing_confidence * 100)}%
                    </span>
                  </div>
                  <div className="confidence-meter">
                    <div className="confidence-bar">
                      <div
                        className={`confidence-fill ${confLevel}`}
                        style={{ width: `${Math.round(doc.processing_confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-workspace)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>FIRST UPLOADED</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {formatDate(doc.created_at)}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-workspace)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>LAST INDEXED</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {formatDate(doc.updated_at)}
                    </div>
                  </div>
                </div>

                {/* S3 Storage Location */}
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    S3 Bucket Storage Key
                  </span>
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'var(--surface-workspace)',
                      borderRadius: '8px',
                      border: '1px solid var(--surface-border)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-all',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <HardDrive size={14} color="var(--charcoal-900)" style={{ flexShrink: 0 }} />
                    <span>{doc.s3_key || 'docuvault-storage-jainish'}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Extracted Keywords & Skills Card */}
            {((doc.keywords && doc.keywords.length > 0) || (doc.skills && doc.skills.length > 0)) && (
              <motion.div
                className="card"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="section-title">
                  <Tag size={17} color="var(--charcoal-900)" />
                  Keywords & Academic Competencies
                </div>

                {doc.keywords && doc.keywords.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>RECOGNIZED KEYWORDS</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {doc.keywords.map(kw => <span key={kw} className="tag">{kw}</span>)}
                    </div>
                  </div>
                )}

                {doc.skills && doc.skills.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>EXTRACTED SKILLS & TECHNOLOGIES</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {doc.skills.map(s => <span key={s} className="chip">{s}</span>)}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Expiry Alert Card */}
            {doc.expiry_date && (
              <motion.div
                className="card"
                style={{
                  border: `1px solid ${exp.status === 'expired' ? 'var(--danger-border)' : exp.status === 'expiring' ? '#FED7AA' : 'var(--success-border)'}`,
                  backgroundColor: exp.status === 'expired' ? 'var(--danger-bg)' : exp.status === 'expiring' ? '#FFFBF5' : 'var(--success-bg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                  <Clock
                    size={18}
                    color={exp.status === 'expired' ? 'var(--danger-solid)' : exp.status === 'expiring' ? 'var(--warning-solid)' : 'var(--success-solid)'}
                  />
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>Expiry Status</strong>
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  Expires: <strong>{formatDate(doc.expiry_date)}</strong>
                </div>
                {exp.daysLeft !== undefined && (
                  <div style={{ fontSize: '0.82rem', marginTop: '4px', fontWeight: 600 }}>
                    {exp.daysLeft < 0 ? (
                      <span style={{ color: 'var(--danger-solid)' }}>Expired {Math.abs(exp.daysLeft)} days ago</span>
                    ) : (
                      <span style={{ color: exp.status === 'expiring' ? 'var(--warning-solid)' : 'var(--success-solid)' }}>
                        {exp.daysLeft} days remaining
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
            <motion.div
              className="modal"
              onClick={e => e.stopPropagation()}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
            >
              <h2 className="modal-title">Delete Document?</h2>
              <div className="modal-body">
                Are you sure you want to permanently delete <strong>"{doc.file_name}"</strong> from DocuVault?
                The file will be expunged from S3 storage and DynamoDB metadata records.
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(false)} disabled={isDeleting}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  id="btn-confirm-delete"
                >
                  {isDeleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                  <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
