/**
 * DocuVault - API Client
 * Switches between DEMO mode and real AWS API based on VITE_DEMO_MODE env var.
 */

import axios from 'axios';
import type { Document } from '../demo/demoStore';
import {
  demoGetDocuments,
  demoGetDocument,
  demoCreateDocument,
  demoDeleteDocument,
  demoSearchDocuments,
  demoGetAdminStats,
} from '../demo/demoStore';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true' || !import.meta.env.VITE_API_URL;
const API_BASE = import.meta.env.VITE_API_URL || '';

// Axios instance with auth header interceptor
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('docuvault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('docuvault_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Helper ───────────────────────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Documents API ────────────────────────────────────────────────────────────

export async function fetchDocuments(): Promise<Document[]> {
  if (IS_DEMO) {
    await delay(400);
    return demoGetDocuments();
  }
  const res = await api.get('/documents');
  return res.data.documents;
}

export async function fetchDocument(documentId: string): Promise<Document & { download_url?: string }> {
  if (IS_DEMO) {
    await delay(300);
    const doc = demoGetDocument(documentId);
    if (!doc) throw new Error('Document not found');
    return { ...doc, download_url: undefined };
  }
  const res = await api.get(`/documents/${documentId}`);
  return res.data.document;
}

export async function requestUploadUrl(
  fileName: string,
  contentType: string,
  fileSize: number
): Promise<{ document_id: string; upload_url: string; expires_in: number }> {
  if (IS_DEMO) {
    await delay(500);
    return demoCreateDocument(fileName, contentType);
  }
  const res = await api.post('/documents/upload-url', { file_name: fileName, content_type: contentType, file_size: fileSize });
  return res.data;
}

export async function uploadFileToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> {
  if (IS_DEMO) {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await delay(150);
      onProgress?.(i);
    }
    return;
  }
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
    },
  });
}

export async function deleteDocument(documentId: string): Promise<void> {
  if (IS_DEMO) {
    await delay(400);
    demoDeleteDocument(documentId);
    return;
  }
  await api.delete(`/documents/${documentId}`);
}

export async function searchDocuments(
  query: string,
  type?: string,
  expiryFilter?: string
): Promise<Document[]> {
  if (IS_DEMO) {
    await delay(300);
    return demoSearchDocuments(query, type, expiryFilter);
  }
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (type) params.set('type', type);
  if (expiryFilter) params.set('expiry_status', expiryFilter);
  const res = await api.get(`/documents/search?${params}`);
  return res.data.documents;
}

export async function retryProcessing(documentId: string): Promise<void> {
  if (IS_DEMO) {
    await delay(500);
    // In demo mode, simulate reprocessing
    const doc = demoGetDocument(documentId);
    if (doc) {
      doc.processing_status = 'PROCESSING';
      setTimeout(() => { if (doc) doc.processing_status = 'PROCESSED'; }, 5000);
    }
    return;
  }
  // Automatic retry route (/documents/{id}/retry) is not currently implemented on API Gateway
  throw new Error('Reprocessing endpoint is not yet configured on the live API. Please re-upload the document to process again.');
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export async function fetchAdminStats() {
  if (IS_DEMO) {
    await delay(500);
    return demoGetAdminStats();
  }
  const res = await api.get('/admin/statistics');
  return res.data.statistics;
}

// ─── Mode indicator ───────────────────────────────────────────────────────────
export const isDemoMode = IS_DEMO;
