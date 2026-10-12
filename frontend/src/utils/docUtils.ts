import type { DocumentType, ProcessingStatus } from '../demo/demoStore';

/** Returns the emoji + CSS class for a document type */
export function getDocTypeInfo(type: DocumentType) {
  const map: Record<DocumentType, { emoji: string; label: string; badgeClass: string; color: string }> = {
    CERTIFICATE:          { emoji: '🏆', label: 'Certificate',          badgeClass: 'badge-cert',    color: '#818cf8' },
    MARK_SHEET:           { emoji: '📊', label: 'Mark Sheet',           badgeClass: 'badge-mark',    color: '#34d399' },
    INTERNSHIP:           { emoji: '💼', label: 'Internship',           badgeClass: 'badge-intern',  color: '#fbbf24' },
    RESUME:               { emoji: '📄', label: 'Resume / CV',          badgeClass: 'badge-resume',  color: '#a78bfa' },
    ID_DOCUMENT:          { emoji: '🪪', label: 'ID Document',          badgeClass: 'badge-id',      color: '#f472b6' },
    COURSE_COMPLETION:    { emoji: '🎓', label: 'Course Completion',    badgeClass: 'badge-course',  color: '#22d3ee' },
    ACHIEVEMENT:          { emoji: '⭐', label: 'Achievement',          badgeClass: 'badge-achieve', color: '#eab308' },
    RECOMMENDATION_LETTER:{ emoji: '✉️', label: 'Recommendation',      badgeClass: 'badge-rec',     color: '#2dd4bf' },
    OTHER:                { emoji: '📁', label: 'Other',                badgeClass: 'badge-other',   color: '#9ca3af' },
  };
  return map[type] || map.OTHER;
}

/** Returns CSS badge class for processing status */
export function getStatusBadgeClass(status: ProcessingStatus): string {
  const map: Record<ProcessingStatus, string> = {
    PROCESSED:         'badge-processed',
    UPLOADED:          'badge-uploaded',
    PROCESSING:        'badge-processing',
    PROCESSING_FAILED: 'badge-failed',
  };
  return map[status] || 'badge-other';
}

export function getStatusLabel(status: ProcessingStatus): string {
  const map: Record<ProcessingStatus, string> = {
    PROCESSED:         '✓ Processed',
    UPLOADED:          '↑ Uploaded',
    PROCESSING:        '⟳ Processing',
    PROCESSING_FAILED: '✕ Failed',
  };
  return map[status] || status;
}

/** Format bytes to human-readable */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Format ISO date string */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

/** Calculate expiry status */
export function getExpiryStatus(expiryDate: string | null): {
  status: 'none' | 'valid' | 'expiring' | 'expired';
  label: string;
  badgeClass: string;
  daysLeft?: number;
} {
  if (!expiryDate) return { status: 'none', label: 'No Expiry', badgeClass: '' };
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return { status: 'expired', label: 'Expired', badgeClass: 'badge-expired', daysLeft };
  if (daysLeft <= 30) return { status: 'expiring', label: `Expires in ${daysLeft}d`, badgeClass: 'badge-expiring', daysLeft };
  return { status: 'valid', label: `Valid until ${formatDate(expiryDate)}`, badgeClass: 'badge-valid', daysLeft };
}

/** Get confidence level label */
export function getConfidenceLevel(conf: number): 'high' | 'medium' | 'low' {
  if (conf >= 0.7) return 'high';
  if (conf >= 0.4) return 'medium';
  return 'low';
}

/** MIME type to display label */
export function getMimeLabel(contentType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
  };
  return map[contentType] || contentType;
}

export const ALL_DOC_TYPES: DocumentType[] = [
  'CERTIFICATE', 'MARK_SHEET', 'INTERNSHIP', 'RESUME',
  'ID_DOCUMENT', 'COURSE_COMPLETION', 'ACHIEVEMENT', 'RECOMMENDATION_LETTER', 'OTHER',
];

export const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
export const MAX_FILE_SIZE_MB = 20;
