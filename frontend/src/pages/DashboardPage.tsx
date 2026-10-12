import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchDocuments } from '../api/client';
import type { Document } from '../demo/demoStore';
import {
  getDocTypeInfo, getStatusBadgeClass, getStatusLabel,
  formatDate, getExpiryStatus, ALL_DOC_TYPES,
} from '../utils/docUtils';
import {
  LayoutDashboard, Upload, FolderOpen, AlertTriangle,
  Clock, CheckCircle2, ArrowRight, RefreshCw,
  FileCheck, ShieldAlert, Sparkles, ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

// Minimalist, curated chart palette (restrained charcoal, lime, sage, sand, amber)
const CHART_PALETTE = ['#222222', '#c7ea50', '#10b981', '#64748b', '#f59e0b', '#8b5cf6', '#a8a29e'];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'CERTIFICATE' | 'MARK_SHEET' | 'INTERNSHIP'>('ALL');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to load documents from API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Computed stats
  const totalDocs = documents.length;
  const processed = documents.filter(d => d.processing_status === 'PROCESSED').length;
  const failed = documents.filter(d => d.processing_status === 'PROCESSING_FAILED').length;
  const uploading = documents.filter(d => d.processing_status === 'UPLOADED' || d.processing_status === 'PROCESSING').length;

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiring = documents.filter(d => {
    if (!d.expiry_date) return false;
    const exp = new Date(d.expiry_date);
    return exp >= now && exp <= thirtyDays;
  });

  const byCategory = ALL_DOC_TYPES.map(type => ({
    name: getDocTypeInfo(type).label,
    value: documents.filter(d => d.document_type === type).length,
    type,
  })).filter(d => d.value > 0);

  const filteredRecent = documents
    .filter(d => activeTab === 'ALL' || d.document_type === activeTab)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.07,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <LayoutDashboard size={24} color="var(--charcoal-900)" />
            Document Dashboard
          </h1>
          <p className="page-subtitle">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'} — your academic credentials and verified files.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={load}
            disabled={isLoading}
            id="btn-refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-lime btn-sm"
            onClick={() => navigate('/upload')}
            id="btn-upload"
          >
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        </div>
      </header>

      <div className="page-body">
        {/* Error notification if live or demo request fails */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Error Loading Documents</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>{error}</div>
            </div>
          </div>
        )}

        {/* 4 Clean White Stat Cards with Restrained Lime Accents */}
        <div className="grid-stats" style={{ marginBottom: '1.75rem' }}>
          {/* 1. Total Documents */}
          <motion.div
            variants={itemVariants}
            className="stat-card stat-card-accent-lime"
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
          >
            <div>
              <div className="stat-value">{isLoading ? '—' : totalDocs}</div>
              <div className="stat-label">Total Documents</div>
              <div className="stat-meta">
                <span className="badge badge-lime" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Vault Active</span>
                <span>In S3 Storage</span>
              </div>
            </div>
            <div className="stat-icon lime">
              <FolderOpen size={20} />
            </div>
          </motion.div>

          {/* 2. Processed & Verified */}
          <motion.div
            variants={itemVariants}
            className="stat-card"
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
          >
            <div>
              <div className="stat-value">{isLoading ? '—' : processed}</div>
              <div className="stat-label">Verified & Processed</div>
              <div className="stat-meta">
                <span className="badge badge-processed" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>AI OCR Verified</span>
              </div>
            </div>
            <div className="stat-icon success">
              <CheckCircle2 size={20} />
            </div>
          </motion.div>

          {/* 3. Expiring Soon */}
          <motion.div
            variants={itemVariants}
            className="stat-card"
            style={{ cursor: expiring.length > 0 ? 'pointer' : 'default' }}
            onClick={() => expiring.length > 0 && navigate('/expiring')}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
          >
            <div>
              <div className="stat-value">{isLoading ? '—' : expiring.length}</div>
              <div className="stat-label">Expiring in 30 Days</div>
              <div className="stat-meta">
                {expiring.length > 0 ? (
                  <span className="badge badge-expiring" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                    Requires Attention
                  </span>
                ) : (
                  <span className="badge badge-processed" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                    All Up to Date
                  </span>
                )}
              </div>
            </div>
            <div className="stat-icon warning">
              <AlertTriangle size={20} />
            </div>
          </motion.div>

          {/* 4. Processing / Status */}
          <motion.div
            variants={itemVariants}
            className="stat-card"
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
          >
            <div>
              <div className="stat-value">
                {isLoading ? '—' : (failed > 0 ? failed : uploading)}
              </div>
              <div className="stat-label">{failed > 0 ? 'Processing Attention' : 'Active Pipeline'}</div>
              <div className="stat-meta">
                {failed > 0 ? (
                  <span className="badge badge-failed" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{failed} Failed</span>
                ) : (
                  <span className="badge badge-uploaded" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Lambda Ready</span>
                )}
              </div>
            </div>
            <div className={`stat-icon ${failed > 0 ? 'danger' : 'brand'}`}>
              <FileCheck size={20} />
            </div>
          </motion.div>
        </div>

        {/* Middle Section: Expiry Alert Section & Minimalist Category Chart */}
        <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
          {/* Well-Designed Expiry-Alert Section */}
          <motion.div
            variants={itemVariants}
            className="card"
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div className="card-header" style={{ marginBottom: '1rem' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>
                  <AlertTriangle size={18} color="var(--warning-solid)" />
                  Expiry Alerts & Deadlines
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate('/expiring')}
                  style={{ fontSize: '0.78rem' }}
                >
                  View All <ArrowRight size={13} />
                </button>
              </div>

              {isLoading ? (
                <div className="loading-state" style={{ padding: '2rem' }}>
                  <div className="spinner" />
                </div>
              ) : expiring.length === 0 ? (
                <div
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--surface-workspace)',
                    borderRadius: '12px',
                    border: '1px solid var(--surface-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'var(--success-bg)',
                      border: '1px solid var(--success-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--success-solid)',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      All Documents Currently Valid
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      No academic certifications or student documents expire in the next 30 days.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {expiring.slice(0, 3).map((doc) => {
                    const info = getDocTypeInfo(doc.document_type);
                    const exp = getExpiryStatus(doc.expiry_date);
                    return (
                      <div
                        key={doc.document_id}
                        onClick={() => navigate(`/documents/${doc.document_id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 0.95rem',
                          backgroundColor: '#FFFBF5',
                          border: '1px solid #FED7AA',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          <span style={{ fontSize: '1.15rem' }}>{info.emoji}</span>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {doc.file_name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              Expires: {formatDate(doc.expiry_date)}
                            </div>
                          </div>
                        </div>
                        <span className={`badge ${exp.badgeClass}`}>{exp.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--surface-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Automated expiry scans active</span>
              <span className="badge badge-uploaded" style={{ fontSize: '0.68rem' }}>30-Day Window</span>
            </div>
          </motion.div>

          {/* Minimalist Document-Category Chart */}
          <motion.div variants={itemVariants} className="card">
            <div className="card-header" style={{ marginBottom: '0.75rem' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>
                <Sparkles size={18} color="var(--charcoal-900)" />
                Document Categories
              </div>
              <span className="badge badge-charcoal" style={{ fontSize: '0.68rem' }}>
                {byCategory.length} Types
              </span>
            </div>

            {isLoading ? (
              <div className="loading-state" style={{ padding: '2.5rem' }}>
                <div className="spinner" />
              </div>
            ) : byCategory.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-title">No categorized files</div>
                <p className="empty-state-subtitle">Upload your first document to see category distributions.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ width: 170, height: 170, flexShrink: 0, margin: '0 auto' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {byCategory.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--surface-border)',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-md)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Minimalist Legend */}
                <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {byCategory.map((item, idx) => {
                    const pct = Math.round((item.value / totalDocs) * 100) || 0;
                    return (
                      <div
                        key={item.type}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem',
                          padding: '0.25rem 0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '2px',
                              backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length],
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{item.value}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Documents Section */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div className="section-title" style={{ marginBottom: '2px' }}>
                <Clock size={18} color="var(--charcoal-900)" />
                Recently Uploaded Documents
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Track processing status, validity, and metadata
              </p>
            </div>

            {/* Quick Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {(['ALL', 'CERTIFICATE', 'MARK_SHEET', 'INTERNSHIP'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                >
                  {tab === 'ALL' ? 'All Files' : tab.replace('_', ' ')}
                </button>
              ))}

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/documents')}
                style={{ fontSize: '0.78rem', marginLeft: '0.25rem' }}
              >
                View Vault <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : filteredRecent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <div className="empty-state-title">No documents in this view</div>
              <p className="empty-state-subtitle">Upload your academic documents or select another filter.</p>
              <button className="btn btn-lime btn-sm" onClick={() => navigate('/upload')}>
                <Upload size={14} /> Upload First File
              </button>
            </div>
          ) : (
            <div className="grid-docs">
              {filteredRecent.map((doc) => {
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
                      <div className="doc-info">
                        <span className={`badge ${getStatusBadgeClass(doc.processing_status)}`}>
                          {getStatusLabel(doc.processing_status)}
                        </span>
                        <span className={`badge ${info.badgeClass}`}>{info.label}</span>
                        {doc.issuer && (
                          <span className="doc-info-item">
                            🏛️ {doc.issuer}
                          </span>
                        )}
                        {exp.status === 'expiring' && (
                          <span className={`badge ${exp.badgeClass}`}>{exp.label}</span>
                        )}
                        <span className="doc-info-item">
                          <Clock size={12} /> {formatDate(doc.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="doc-actions">
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="View details"
                        aria-label="View details"
                      >
                        <ChevronRight size={18} color="var(--charcoal-900)" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
