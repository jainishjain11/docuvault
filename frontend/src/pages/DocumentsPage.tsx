import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDocuments, deleteDocument } from '../api/client';
import type { Document } from '../demo/demoStore';
import {
  getDocTypeInfo, getStatusBadgeClass, getStatusLabel,
  formatDate, getExpiryStatus, ALL_DOC_TYPES,
} from '../utils/docUtils';
import {
  FolderOpen, Search, Filter, Trash2, Eye, RefreshCw,
  Upload, X, ChevronDown, AlertCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filtered, setFiltered] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
      setFiltered(docs);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let results = [...documents];
    const q = searchQuery.toLowerCase().trim();

    if (q) {
      results = results.filter(d => {
        const searchable = [
          d.file_name, d.title, d.issuer, d.person_name,
          d.document_type, ...(d.keywords || []), ...(d.skills || []),
        ].filter(Boolean).join(' ').toLowerCase();
        return searchable.includes(q);
      });
    }

    if (typeFilter) {
      results = results.filter(d => d.document_type === typeFilter);
    }

    if (statusFilter) {
      results = results.filter(d => d.processing_status === statusFilter);
    }

    setFiltered(results);
  }, [searchQuery, typeFilter, statusFilter, documents]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deleteConfirm.document_id);
      setDocuments(prev => prev.filter(d => d.document_id !== deleteConfirm.document_id));
      setDeleteConfirm(null);
    } catch (e: any) {
      setError(e.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
  };

  const hasFilters = searchQuery || typeFilter || statusFilter;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <FolderOpen size={24} color="var(--charcoal-900)" />
            My Documents Vault
          </h1>
          <p className="page-subtitle">
            Showing {filtered.length} of {documents.length} verified academic credentials
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={isLoading} id="btn-refresh-docs">
            <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-lime btn-sm" onClick={() => navigate('/upload')} id="btn-upload-docs">
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        </div>
      </header>

      <div className="page-body">
        {/* Search & Filters Bar */}
        <div className="card card-sm" style={{ marginBottom: '1.5rem', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: '1', minWidth: 220 }}>
              <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                id="doc-search"
                placeholder="Filter by filename, title, issuer, or extracted skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={14} />
              <span>Filters</span>
              {hasFilters && (
                <span className="badge badge-lime" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                  Active
                </span>
              )}
              <ChevronDown size={12} />
            </button>

            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Filter Row */}
          {showFilters && (
            <div
              style={{
                display: 'flex',
                gap: '0.85rem',
                marginTop: '0.85rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--surface-border)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>CATEGORY</span>
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: 180 }}
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  id="filter-type"
                >
                  <option value="">All Categories</option>
                  {ALL_DOC_TYPES.map(t => (
                    <option key={t} value={t}>{getDocTypeInfo(t).label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>PROCESSING STATUS</span>
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: 170 }}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  id="filter-status"
                >
                  <option value="">All Statuses</option>
                  <option value="PROCESSED">✓ Processed</option>
                  <option value="PROCESSING">⟳ Processing</option>
                  <option value="UPLOADED">↑ Uploaded</option>
                  <option value="PROCESSING_FAILED">✕ Failed</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Error Loading Documents</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>{error}</div>
            </div>
          </div>
        )}

        {/* Documents List */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner spinner-lg" />
            <span>Retrieving vault documents...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              {hasFilters ? '🔍' : '📂'}
            </div>
            <div className="empty-state-title">
              {hasFilters ? 'No documents match your filters' : 'Your vault is empty'}
            </div>
            <p className="empty-state-subtitle">
              {hasFilters
                ? 'Try clearing active keywords or selecting a broader category filter.'
                : 'Upload mark sheets, degrees, or internship proof to start organizing.'}
            </p>
            {hasFilters ? (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                Clear All Filters
              </button>
            ) : (
              <button className="btn btn-lime btn-sm" onClick={() => navigate('/upload')}>
                <Upload size={14} /> Upload Your First Document
              </button>
            )}
          </div>
        ) : (
          <div className="grid-docs">
            {filtered.map(doc => {
              const info = getDocTypeInfo(doc.document_type);
              const exp = getExpiryStatus(doc.expiry_date);
              return (
                <motion.div
                  key={doc.document_id}
                  className="doc-card"
                  whileHover={shouldReduceMotion ? {} : { y: -1 }}
                >
                  <div className="doc-icon">
                    {info.emoji}
                  </div>

                  <div
                    className="doc-meta"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/documents/${doc.document_id}`)}
                  >
                    <div className="doc-name">{doc.file_name}</div>
                    {doc.title && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                        {doc.title}
                      </div>
                    )}
                    <div className="doc-info">
                      <span className={`badge ${getStatusBadgeClass(doc.processing_status)}`}>
                        {getStatusLabel(doc.processing_status)}
                      </span>
                      <span className={`badge ${info.badgeClass}`}>{info.label}</span>
                      {doc.issuer && (
                        <span className="doc-info-item">🏛️ {doc.issuer}</span>
                      )}
                      {exp.status !== 'none' && (
                        <span className={`badge ${exp.badgeClass}`}>{exp.label}</span>
                      )}
                      <span className="doc-info-item">
                        <Clock size={12} /> {formatDate(doc.created_at)}
                      </span>
                    </div>

                    {/* Keywords / Extracted tags */}
                    {doc.keywords && doc.keywords.length > 0 && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {doc.keywords.slice(0, 5).map(kw => (
                          <span key={kw} className="tag">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="doc-actions">
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      title="View Details"
                      onClick={() => navigate(`/documents/${doc.document_id}`)}
                      id={`btn-view-${doc.document_id}`}
                      aria-label="View document details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      title="Delete Document"
                      onClick={() => setDeleteConfirm(doc)}
                      id={`btn-delete-${doc.document_id}`}
                      aria-label="Delete document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <motion.div
              className="modal"
              onClick={e => e.stopPropagation()}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    backgroundColor: 'var(--danger-bg)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--danger-solid)',
                    border: '1px solid var(--danger-border)',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={20} />
                </div>
                <div>
                  <h2 className="modal-title" style={{ marginBottom: '2px' }}>Confirm Deletion</h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Permanent removal from AWS S3 & DynamoDB</p>
                </div>
              </div>

              <div className="modal-body">
                Are you sure you want to delete <strong>"{deleteConfirm.file_name}"</strong>?
                This operation will delete the record from DynamoDB and remove the file from{' '}
                <code style={{ fontFamily: 'var(--font-mono)' }}>docuvault-storage-jainish</code>.
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
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
