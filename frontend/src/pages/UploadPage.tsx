import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestUploadUrl, uploadFileToS3, isDemoMode } from '../api/client';
import {
  Upload, FileText, X, CheckCircle2, AlertCircle,
  HardDrive, ShieldCheck, RefreshCw
} from 'lucide-react';
import { ALLOWED_TYPES, MAX_FILE_SIZE_MB, formatBytes } from '../utils/docUtils';
import { motion, useReducedMotion } from 'framer-motion';

type UploadState = 'idle' | 'validating' | 'requesting_url' | 'uploading' | 'success' | 'error';

interface SelectedFile {
  file: File;
  preview?: string;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocId, setUploadedDocId] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Unsupported file format (${file.type}). Allowed: PDF, JPG, PNG`;
    }
    if (file.size === 0) {
      return 'File is empty. Please select a valid document.';
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File exceeds maximum size of ${MAX_FILE_SIZE_MB}MB (your file: ${formatBytes(file.size)})`;
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError('');
    setUploadState('idle');
    setUploadedDocId('');

    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }
    setSelectedFile({ file, preview });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setError('');
    setUploadProgress(0);

    try {
      setUploadState('validating');
      setStatusMessage('Validating document integrity...');
      await new Promise(r => setTimeout(r, 250));

      setUploadState('requesting_url');
      setStatusMessage('Generating presigned S3 upload URL...');
      const { document_id, upload_url } = await requestUploadUrl(
        selectedFile.file.name,
        selectedFile.file.type,
        selectedFile.file.size,
      );

      setUploadedDocId(document_id);
      setUploadState('uploading');
      setStatusMessage('Streaming document directly to S3 bucket...');

      await uploadFileToS3(upload_url, selectedFile.file, (pct) => {
        setUploadProgress(pct);
        setStatusMessage(`Uploading to AWS... ${pct}%`);
      });

      setUploadState('success');
      setStatusMessage('Upload complete! Document queued for Textract classification.');
    } catch (err: any) {
      setUploadState('error');
      setError(err.response?.data?.error || err.message || 'Upload failed. Please check network and permissions.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setUploadProgress(0);
    setUploadedDocId('');
    setError('');
    setStatusMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isUploading = uploadState === 'validating' || uploadState === 'requesting_url' || uploadState === 'uploading';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <Upload size={24} color="var(--charcoal-900)" />
            Upload Academic Document
          </h1>
          <p className="page-subtitle">
            Securely upload mark sheets, certificates, transcripts, or internship proofs to your vault.
          </p>
        </div>
      </header>

      <div className="page-body" style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        {/* Environment Alert */}
        {isDemoMode && (
          <div className="alert alert-lime" style={{ marginBottom: '1.5rem' }}>
            <HardDrive size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Demo Environment Active:</strong> Documents are stored in simulated local state.
              In live production, files upload directly to private S3 bucket{' '}
              <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>docuvault-storage-jainish</code>.
            </div>
          </div>
        )}

        {/* Success Card with Framer Motion entrance */}
        {uploadState === 'success' && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card"
            style={{ marginBottom: '1.75rem', border: '1px solid var(--success-border)', backgroundColor: '#FFFFFF' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem', textAlign: 'center' }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: 'var(--success-bg)',
                  border: '1px solid var(--success-border)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--success-solid)',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Document Uploaded Successfully!
                </h2>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Document Record ID:{' '}
                  <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--charcoal-900)' }}>
                    {uploadedDocId}
                  </code>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto' }}>
                  Your document has been safely delivered to S3 storage and queued for optical character recognition and metadata extraction.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/documents/${uploadedDocId}`)}
                  id="btn-view-doc"
                >
                  <FileText size={15} /> View Document Details
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/documents')}
                >
                  Go to Vault
                </button>
                <button className="btn btn-ghost" onClick={handleReset}>
                  <RefreshCw size={14} /> Upload Another
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dropzone Container */}
        {uploadState !== 'success' && (
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            style={{ cursor: selectedFile ? 'default' : 'pointer' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={handleInputChange}
              id="file-upload-input"
            />

            {!selectedFile ? (
              <>
                <div className="upload-icon">
                  <Upload size={28} />
                </div>
                <div className="upload-title">Drag & drop your document here</div>
                <div className="upload-subtitle">or click to browse from your device</div>
                <div className="upload-formats">
                  <span className="format-tag">PDF</span>
                  <span className="format-tag">JPG</span>
                  <span className="format-tag">PNG</span>
                  <span className="format-tag">Max {MAX_FILE_SIZE_MB}MB</span>
                </div>
              </>
            ) : (
              <div style={{ width: '100%' }} onClick={e => e.stopPropagation()}>
                {/* File Preview */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1.25rem',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    padding: '1.25rem',
                    backgroundColor: 'var(--surface-workspace)',
                    borderRadius: '12px',
                    border: '1px solid var(--surface-border)',
                  }}
                >
                  {selectedFile.preview ? (
                    <img
                      src={selectedFile.preview}
                      alt="Document preview"
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid var(--surface-border)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--surface-border)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        flexShrink: 0,
                      }}
                    >
                      📄
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.96rem',
                        color: 'var(--text-primary)',
                        wordBreak: 'break-all',
                        marginBottom: '4px',
                      }}
                    >
                      {selectedFile.file.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {formatBytes(selectedFile.file.size)} · {selectedFile.file.type || 'Document'}
                    </div>
                  </div>

                  {!isUploading && (
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={handleReset}
                      aria-label="Remove file"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Animated Upload Progress */}
                {isUploading && (
                  <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="spinner" style={{ width: 14, height: 14 }} />
                        {statusMessage}
                      </span>
                      <span style={{ fontWeight: 800, color: 'var(--charcoal-900)' }}>{uploadProgress}%</span>
                    </div>

                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: 'easeOut', duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                {/* Pipeline Step Badges */}
                {isUploading && (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                      { key: 'validating', label: '1. Validate File' },
                      { key: 'requesting_url', label: '2. Presigned URL' },
                      { key: 'uploading', label: '3. Direct S3 Upload' },
                    ].map(({ key, label }) => {
                      const states: UploadState[] = ['validating', 'requesting_url', 'uploading', 'success'];
                      const stateIdx = states.indexOf(uploadState);
                      const stepIdx = states.indexOf(key as UploadState);
                      const isActive = stateIdx === stepIdx;
                      const isDone = stateIdx > stepIdx;

                      return (
                        <div
                          key={key}
                          className={`badge ${isDone ? 'badge-processed' : isActive ? 'badge-lime' : 'badge-uploaded'}`}
                        >
                          {isDone ? '✓ ' : isActive ? '● ' : '○ '}
                          {label}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action Buttons */}
                {!isUploading && (
                  <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" onClick={handleReset}>
                      <X size={14} /> Choose Different File
                    </button>
                    <button className="btn btn-lime btn-lg" onClick={handleUpload} id="btn-start-upload">
                      <Upload size={16} /> Start Secure Upload
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="alert alert-danger" style={{ marginTop: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Upload Unsuccessful</strong>
              <div style={{ fontSize: '0.84rem', marginTop: '2px' }}>{error}</div>
            </div>
          </div>
        )}

        {/* Informational Guidance Card */}
        {uploadState === 'idle' && !selectedFile && (
          <div className="card" style={{ marginTop: '1.75rem' }}>
            <div className="section-title" style={{ fontSize: '0.95rem' }}>
              <ShieldCheck size={18} color="var(--charcoal-900)" />
              Automated Vault Processing Pipeline
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {[
                { icon: '🔒', title: 'S3 Private Encryption', desc: 'Stored under your authenticated partition in ap-southeast-2' },
                { icon: '🤖', title: 'Intelligent Classification', desc: 'Auto-detects transcripts, certs, mark sheets, and resumes' },
                { icon: '📅', title: 'Expiry & Deadline Tracking', desc: 'Monitors credential validities and alerts you 30 days prior' },
                { icon: '⚡', title: 'Smart Search Indexing', desc: 'Keywords and extracted skills become instantly searchable' },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--surface-workspace)',
                    borderRadius: '10px',
                    border: '1px solid var(--surface-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                    <span>{icon}</span> {title}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
