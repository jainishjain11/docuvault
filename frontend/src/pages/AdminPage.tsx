import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchAdminStats } from '../api/client';
import { getDocTypeInfo, getStatusBadgeClass, getStatusLabel } from '../utils/docUtils';
import {
  Shield, Users, FolderOpen, CheckCircle2,
  TrendingUp, Activity, RefreshCw, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, useReducedMotion } from 'framer-motion';

const ADMIN_CHART_PALETTE = ['#222222', '#c7ea50', '#10b981', '#64748b', '#f59e0b', '#8b5cf6', '#a8a29e'];

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to load administrative statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/dashboard');
      return;
    }
    load();
  }, [user, navigate]);

  if (!user?.isAdmin) return null;

  const chartData = stats?.by_category ? Object.entries(stats.by_category).map(([key, val]) => ({
    name: getDocTypeInfo(key as any).label,
    count: val as number,
  })).sort((a, b) => (b.count as number) - (a.count as number)) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <Shield size={24} color="var(--charcoal-900)" />
            Admin Telemetry & Statistics
          </h1>
          <p className="page-subtitle">
            System-wide storage metrics, Textract processing success rate, and active users
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={load} disabled={isLoading} id="btn-admin-refresh">
          <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </header>

      <div className="page-body">
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* 4 Clean White Stat Cards */}
        <div className="grid-stats" style={{ marginBottom: '2rem' }}>
          <motion.div className="stat-card" whileHover={shouldReduceMotion ? {} : { y: -2 }}>
            <div>
              <div className="stat-value">{isLoading ? '—' : (stats?.total_users || 0)}</div>
              <div className="stat-label">Registered Students</div>
              <div className="stat-meta">
                <span className="badge badge-charcoal" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Cognito Directory</span>
              </div>
            </div>
            <div className="stat-icon brand"><Users size={20} /></div>
          </motion.div>

          <motion.div className="stat-card stat-card-accent-lime" whileHover={shouldReduceMotion ? {} : { y: -2 }}>
            <div>
              <div className="stat-value">{isLoading ? '—' : (stats?.total_documents || 0)}</div>
              <div className="stat-label">Total Vault Documents</div>
              <div className="stat-meta">
                <span className="badge badge-lime" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>S3 Bucket</span>
              </div>
            </div>
            <div className="stat-icon lime"><FolderOpen size={20} /></div>
          </motion.div>

          <motion.div className="stat-card" whileHover={shouldReduceMotion ? {} : { y: -2 }}>
            <div>
              <div className="stat-value">{isLoading ? '—' : (stats?.processed || 0)}</div>
              <div className="stat-label">OCR Processed</div>
              <div className="stat-meta">
                <span className="badge badge-processed" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Textract Passed</span>
              </div>
            </div>
            <div className="stat-icon success"><CheckCircle2 size={20} /></div>
          </motion.div>

          <motion.div className="stat-card" whileHover={shouldReduceMotion ? {} : { y: -2 }}>
            <div>
              <div className="stat-value">{isLoading ? '—' : (stats?.processing_failed || 0)}</div>
              <div className="stat-label">Pipeline Failures</div>
              <div className="stat-meta">
                <span className={`badge ${stats?.processing_failed > 0 ? 'badge-failed' : 'badge-processed'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  {stats?.processing_failed > 0 ? 'Errors Logged' : 'Zero Errors'}
                </span>
              </div>
            </div>
            <div className="stat-icon danger"><AlertCircle size={20} /></div>
          </motion.div>
        </div>

        {/* Charts & Status */}
        <div className="grid-2">
          {/* Bar Chart: Documents by Category */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>
                <TrendingUp size={18} color="var(--charcoal-900)" />
                Distribution by Document Category
              </div>
            </div>

            {isLoading ? (
              <div className="loading-state" style={{ padding: '2.5rem' }}>
                <div className="spinner" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
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
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={ADMIN_CHART_PALETTE[i % ADMIN_CHART_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-title">No category data available</div>
              </div>
            )}
          </div>

          {/* Processing Status Breakdown */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <div className="section-title" style={{ marginBottom: 0 }}>
                <Activity size={18} color="var(--charcoal-900)" />
                Microservices Pipeline Health
              </div>
            </div>

            {isLoading ? (
              <div className="loading-state" style={{ padding: '2.5rem' }}>
                <div className="spinner" />
              </div>
            ) : stats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {[
                  { label: 'Successfully Processed', value: stats.processed, total: stats.total_documents, color: 'var(--success-solid)' },
                  { label: 'Classification Failures', value: stats.processing_failed, total: stats.total_documents, color: 'var(--danger-solid)' },
                  { label: 'Uploaded / Pending Queue', value: stats.uploaded || 0, total: stats.total_documents, color: 'var(--charcoal-900)' },
                  { label: 'In-Flight Lambda Execution', value: stats.processing || 0, total: stats.total_documents, color: 'var(--lime-600)' },
                ].map(({ label, value, total, color }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ color, fontWeight: 800 }}>{value}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        style={{
                          height: '100%',
                          width: total > 0 ? `${Math.min(100, (value / total) * 100)}%` : '0%',
                          backgroundColor: color,
                          borderRadius: '999px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Recent System Activity Table */}
        <div className="card" style={{ marginTop: '1.75rem' }}>
          <div className="card-header" style={{ marginBottom: '1rem' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              <Activity size={18} color="var(--charcoal-900)" />
              Recent Ingestion & Telemetry Logs
            </div>
            <span className="badge badge-uploaded">Real-time Feed</span>
          </div>

          {isLoading ? (
            <div className="loading-state"><div className="spinner" /></div>
          ) : stats?.recent_activity?.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Document ID</th>
                    <th>Classification</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_activity.map((item: any) => {
                    const info = getDocTypeInfo(item.document_type);
                    return (
                      <tr key={item.document_id}>
                        <td>
                          <code style={{ fontSize: '0.78rem', color: 'var(--charcoal-900)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {item.document_id}
                          </code>
                        </td>
                        <td>
                          <span className={`badge ${info.badgeClass}`}>{info.emoji} {info.label}</span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(item.processing_status)}`}>
                            {getStatusLabel(item.processing_status)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-title">No recent ingestion logs</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
