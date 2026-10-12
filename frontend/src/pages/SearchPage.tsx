import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchDocuments } from '../api/client';
import type { Document } from '../demo/demoStore';
import {
  getDocTypeInfo, getStatusBadgeClass, getStatusLabel,
  formatDate, getExpiryStatus, ALL_DOC_TYPES,
} from '../utils/docUtils';
import { Search, X, Clock, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export default function SearchPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [expiryFilter, setExpiryFilter] = useState(searchParams.get('expiry') || '');
  const [results, setResults] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const doSearch = useCallback(async (q: string, type: string, expiry: string) => {
    setIsLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const res = await searchDocuments(q, type || undefined, expiry || undefined);
      setResults(res);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Search request failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-search if URL has params
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const type = searchParams.get('type') || '';
    const expiry = searchParams.get('expiry') || '';
    if (q || type || expiry) {
      setQuery(q);
      setTypeFilter(type);
      setExpiryFilter(expiry);
      doSearch(q, type, expiry);
    }
  }, []); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (typeFilter) params.set('type', typeFilter);
    if (expiryFilter) params.set('expiry', expiryFilter);
    setSearchParams(params);
    doSearch(query, typeFilter, expiryFilter);
  };

  const clearSearch = () => {
    setQuery('');
    setTypeFilter('');
    setExpiryFilter('');
    setResults([]);
    setHasSearched(false);
    setSearchParams({});
  };

  const POPULAR_SEARCHES = ['AWS Cloud', 'Internship Certificate', 'Academic Transcript', 'Python', 'Grade Sheet', 'ID Card'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <Search size={24} color="var(--charcoal-900)" />
            Smart Academic Search
          </h1>
          <p className="page-subtitle">
            Query across file names, detected institutions, dates, and AI-extracted competencies
          </p>
        </div>
      </header>

      <div className="page-body">
        {/* Search Card */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="search-bar" style={{ height: 50, padding: '0.6rem 1rem' }}>
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                id="search-input"
                type="text"
                placeholder='Search credentials, issuers, or skills... e.g. "AWS Practitioner" or "Stanford"'
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ fontSize: '0.96rem' }}
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setQuery('')}
                  aria-label="Clear search input"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: 180 }}
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                id="search-type-filter"
              >
                <option value="">All Categories</option>
                {ALL_DOC_TYPES.map(t => (
                  <option key={t} value={t}>{getDocTypeInfo(t).label}</option>
                ))}
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: 180 }}
                value={expiryFilter}
                onChange={e => setExpiryFilter(e.target.value)}
                id="search-expiry-filter"
              >
                <option value="">All Validity States</option>
                <option value="expiring">Expiring Soon (30 days)</option>
                <option value="expired">Expired Credentials</option>
                <option value="valid">Currently Valid</option>
                <option value="no_expiry">No Expiry Date</option>
              </select>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.65rem' }}>
                {(query || typeFilter || expiryFilter) && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={clearSearch}>
                    <X size={14} /> Clear
                  </button>
                )}
                <button type="submit" className="btn btn-lime" id="btn-search" disabled={isLoading}>
                  {isLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Search size={15} />}
                  <span>Execute Search</span>
                </button>
              </div>
            </div>
          </form>

          {/* Quick suggestions */}
          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} color="var(--charcoal-900)" /> SUGGESTIONS:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {POPULAR_SEARCHES.map(s => (
                <button
                  key={s}
                  className="chip"
                  style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
                  onClick={() => {
                    setQuery(s);
                    doSearch(s, typeFilter, expiryFilter);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Search Results */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner spinner-lg" />
            <span>Searching metadata across encrypted storage...</span>
          </div>
        ) : hasSearched ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {results.length === 0 ? (
                  'No matching documents found'
                ) : (
                  <span>
                    Discovered <strong style={{ color: 'var(--text-primary)' }}>{results.length}</strong> matching document{results.length !== 1 ? 's' : ''}
                    {query && <span> for query "<strong style={{ color: 'var(--charcoal-900)' }}>{query}</strong>"</span>}
                  </span>
                )}
              </div>
            </div>

            {results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No documents match this query</div>
                <p className="empty-state-subtitle">
                  Check for spelling variations or remove category filters to broaden your search.
                </p>
                <button className="btn btn-secondary btn-sm" onClick={clearSearch}>
                  Reset Search
                </button>
              </div>
            ) : (
              <div className="grid-docs">
                {results.map(doc => {
                  const info = getDocTypeInfo(doc.document_type);
                  const exp = getExpiryStatus(doc.expiry_date);
                  return (
                    <motion.div
                      key={doc.document_id}
                      className="doc-card"
                      onClick={() => navigate(`/documents/${doc.document_id}`)}
                      whileHover={shouldReduceMotion ? {} : { y: -1 }}
                    >
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
                          <span className={`badge ${getStatusBadgeClass(doc.processing_status)}`}>
                            {getStatusLabel(doc.processing_status)}
                          </span>
                          <span className={`badge ${info.badgeClass}`}>{info.label}</span>
                          {doc.issuer && <span className="doc-info-item">🏛️ {doc.issuer}</span>}
                          {exp.status !== 'none' && <span className={`badge ${exp.badgeClass}`}>{exp.label}</span>}
                          <span className="doc-info-item"><Clock size={12} /> {formatDate(doc.created_at)}</span>
                        </div>
                        {doc.keywords && doc.keywords.length > 0 && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {doc.keywords.map(kw => <span key={kw} className="tag">{kw}</span>)}
                          </div>
                        )}
                      </div>

                      <div className="doc-actions">
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="View Details"
                          aria-label="View document details"
                        >
                          <ChevronRight size={18} color="var(--charcoal-900)" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <div className="empty-state-title">Instant Academic Search</div>
            <p className="empty-state-subtitle">
              Type keywords above or click any suggested search chip to find certificates and transcripts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
