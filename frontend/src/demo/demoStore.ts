/**
 * DocuVault - Demo Data Store
 * Local demo mode with realistic sample data.
 * Used when VITE_DEMO_MODE=true (no AWS credentials needed).
 */

export interface Document {
  document_id: string;
  user_id: string;
  file_name: string;
  document_type: DocumentType;
  title: string | null;
  issuer: string | null;
  person_name: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  keywords: string[];
  skills: string[];
  s3_key: string;
  processing_status: ProcessingStatus;
  processing_confidence: number;
  created_at: string;
  updated_at: string;
}

export type DocumentType =
  | 'CERTIFICATE'
  | 'MARK_SHEET'
  | 'INTERNSHIP'
  | 'RESUME'
  | 'ID_DOCUMENT'
  | 'COURSE_COMPLETION'
  | 'ACHIEVEMENT'
  | 'RECOMMENDATION_LETTER'
  | 'OTHER';

export type ProcessingStatus = 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'PROCESSING_FAILED';

export interface User {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

const DEMO_USERS: Record<string, User> = {
  student: {
    userId: 'U-DEMO-001',
    email: 'student@demo.docuvault.app',
    name: 'Priya Sharma',
    isAdmin: false,
  },
  admin: {
    userId: 'U-ADMIN-001',
    email: 'admin@demo.docuvault.app',
    name: 'Admin User',
    isAdmin: true,
  },
};

const DEMO_DOCUMENTS: Document[] = [
  {
    document_id: 'DOC-2026-AWS001',
    user_id: 'U-DEMO-001',
    file_name: 'AWS_Cloud_Practitioner_Certificate.pdf',
    document_type: 'CERTIFICATE',
    title: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services',
    person_name: 'Priya Sharma',
    issue_date: '2026-08-20',
    expiry_date: '2029-08-20',
    keywords: ['AWS', 'Cloud', 'Certification'],
    skills: ['AWS', 'Cloud Computing', 'Cloud Architecture'],
    s3_key: 'documents/U-DEMO-001/DOC-2026-AWS001/original_AWS_Cloud_Practitioner_Certificate.pdf',
    processing_status: 'PROCESSED',
    processing_confidence: 0.94,
    created_at: '2026-08-22T10:00:00Z',
    updated_at: '2026-08-22T10:05:00Z',
  },
  {
    document_id: 'DOC-2026-INT002',
    user_id: 'U-DEMO-001',
    file_name: 'TechCorp_Internship_Certificate.pdf',
    document_type: 'INTERNSHIP',
    title: 'Summer Internship Certificate',
    issuer: 'TechCorp Solutions Pvt. Ltd.',
    person_name: 'Priya Sharma',
    issue_date: '2026-07-31',
    expiry_date: null,
    keywords: ['Internship', 'Python', 'Machine Learning'],
    skills: ['Python', 'Machine Learning', 'Data Science'],
    s3_key: 'documents/U-DEMO-001/DOC-2026-INT002/original_TechCorp_Internship_Certificate.pdf',
    processing_status: 'PROCESSED',
    processing_confidence: 0.91,
    created_at: '2026-08-01T09:30:00Z',
    updated_at: '2026-08-01T09:35:00Z',
  },
  {
    document_id: 'DOC-2026-SEM003',
    user_id: 'U-DEMO-001',
    file_name: 'Semester_5_Marksheet.pdf',
    document_type: 'MARK_SHEET',
    title: 'B.Tech Semester V Result',
    issuer: 'VIT University',
    person_name: 'Priya Sharma',
    issue_date: '2026-01-15',
    expiry_date: null,
    keywords: ['Marks', 'CGPA', 'Semester'],
    skills: [],
    s3_key: 'documents/U-DEMO-001/DOC-2026-SEM003/original_Semester_5_Marksheet.pdf',
    processing_status: 'PROCESSED',
    processing_confidence: 0.88,
    created_at: '2026-01-20T11:00:00Z',
    updated_at: '2026-01-20T11:04:00Z',
  },
  {
    document_id: 'DOC-2026-RES004',
    user_id: 'U-DEMO-001',
    file_name: 'Priya_Sharma_Resume_2026.pdf',
    document_type: 'RESUME',
    title: 'Priya Sharma - Software Engineer Resume',
    issuer: null,
    person_name: 'Priya Sharma',
    issue_date: '2026-06-01',
    expiry_date: null,
    keywords: ['Resume', 'React', 'TypeScript', 'AWS'],
    skills: ['React', 'TypeScript', 'Python', 'AWS', 'Node.js'],
    s3_key: 'documents/U-DEMO-001/DOC-2026-RES004/original_Priya_Sharma_Resume_2026.pdf',
    processing_status: 'PROCESSED',
    processing_confidence: 0.85,
    created_at: '2026-06-10T14:00:00Z',
    updated_at: '2026-06-10T14:03:00Z',
  },
  {
    document_id: 'DOC-2026-PY005',
    user_id: 'U-DEMO-001',
    file_name: 'Python_Advanced_Certificate.pdf',
    document_type: 'COURSE_COMPLETION',
    title: 'Advanced Python Programming',
    issuer: 'Coursera - University of Michigan',
    person_name: 'Priya Sharma',
    issue_date: '2026-05-10',
    expiry_date: null,
    keywords: ['Python', 'Programming', 'Coursera'],
    skills: ['Python', 'Data Structures', 'Algorithms'],
    s3_key: 'documents/U-DEMO-001/DOC-2026-PY005/original_Python_Advanced_Certificate.pdf',
    processing_status: 'PROCESSED',
    processing_confidence: 0.90,
    created_at: '2026-05-15T08:00:00Z',
    updated_at: '2026-05-15T08:04:00Z',
  },
  {
    document_id: 'DOC-2026-ID006',
    user_id: 'U-DEMO-001',
    file_name: 'Aadhar_Card.jpg',
    document_type: 'ID_DOCUMENT',
    title: 'Aadhaar Card',
    issuer: 'Government of India - UIDAI',
    person_name: 'Priya Sharma',
    issue_date: '2015-03-15',
    expiry_date: null,
    keywords: ['Aadhaar', 'Identity', 'Government'],
    skills: [],
    s3_key: 'documents/U-DEMO-001/DOC-2026-ID006/original_Aadhar_Card.jpg',
    processing_status: 'PROCESSED',
    processing_confidence: 0.78,
    created_at: '2026-09-01T16:00:00Z',
    updated_at: '2026-09-01T16:06:00Z',
  },
  {
    document_id: 'DOC-2026-AZ007',
    user_id: 'U-DEMO-001',
    file_name: 'Azure_Fundamentals_AZ900.pdf',
    document_type: 'CERTIFICATE',
    title: 'Microsoft Azure Fundamentals AZ-900',
    issuer: 'Microsoft',
    person_name: 'Priya Sharma',
    issue_date: '2026-09-05',
    expiry_date: '2026-11-05',
    keywords: ['Azure', 'Cloud', 'Microsoft'],
    skills: ['Azure', 'Cloud Computing'],
    s3_key: 'documents/U-DEMO-001/DOC-2026-AZ007/original_Azure_Fundamentals_AZ900.pdf',
    processing_status: 'PROCESSED',
    processing_confidence: 0.93,
    created_at: '2026-09-10T10:00:00Z',
    updated_at: '2026-09-10T10:05:00Z',
  },
  {
    document_id: 'DOC-2026-REC008',
    user_id: 'U-DEMO-001',
    file_name: 'Prof_Kumar_Recommendation.pdf',
    document_type: 'RECOMMENDATION_LETTER',
    title: 'Letter of Recommendation',
    issuer: 'Prof. Rajesh Kumar, VIT University',
    person_name: 'Priya Sharma',
    issue_date: '2026-09-20',
    expiry_date: null,
    keywords: ['Recommendation', 'Academic'],
    skills: [],
    s3_key: 'documents/U-DEMO-001/DOC-2026-REC008/original_Prof_Kumar_Recommendation.pdf',
    processing_status: 'PROCESSED',
    processing_confidence: 0.82,
    created_at: '2026-09-25T12:00:00Z',
    updated_at: '2026-09-25T12:03:00Z',
  },
  {
    document_id: 'DOC-2026-FAIL009',
    user_id: 'U-DEMO-001',
    file_name: 'Corrupted_Document.pdf',
    document_type: 'OTHER',
    title: null,
    issuer: null,
    person_name: null,
    issue_date: null,
    expiry_date: null,
    keywords: [],
    skills: [],
    s3_key: 'documents/U-DEMO-001/DOC-2026-FAIL009/original_Corrupted_Document.pdf',
    processing_status: 'PROCESSING_FAILED',
    processing_confidence: 0,
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:02:00Z',
  },
];

// In-memory store for demo session
let _demoDocuments = [...DEMO_DOCUMENTS];
let _currentUser: User | null = null;
let _nextDocCounter = 10;

export function demoLogin(role: 'student' | 'admin'): User {
  _currentUser = DEMO_USERS[role];
  return _currentUser;
}

export function demoLogout(): void {
  _currentUser = null;
}

export function demoGetCurrentUser(): User | null {
  return _currentUser;
}

export function demoGetDocuments(): Document[] {
  if (!_currentUser) return [];
  return _demoDocuments
    .filter(d => d.user_id === _currentUser!.userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function demoGetDocument(documentId: string): Document | null {
  if (!_currentUser) return null;
  const doc = _demoDocuments.find(d => d.document_id === documentId);
  if (!doc || doc.user_id !== _currentUser.userId) return null;
  return doc;
}

export function demoCreateDocument(fileName: string, _contentType: string): {
  document_id: string;
  upload_url: string;
  expires_in: number;
} {
  if (!_currentUser) throw new Error('Not authenticated');

  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const documentId = `DOC-${year}-${suffix.padEnd(6, '0').substring(0, 6)}`;
  const now = new Date().toISOString();

  const newDoc: Document = {
    document_id: documentId,
    user_id: _currentUser.userId,
    file_name: fileName,
    document_type: 'OTHER',
    title: null,
    issuer: null,
    person_name: _currentUser.name,
    issue_date: null,
    expiry_date: null,
    keywords: [],
    skills: [],
    s3_key: `documents/${_currentUser.userId}/${documentId}/original_${fileName}`,
    processing_status: 'UPLOADED',
    processing_confidence: 0,
    created_at: now,
    updated_at: now,
  };

  _demoDocuments.push(newDoc);
  _nextDocCounter++;

  // Simulate processing after a delay
  setTimeout(() => simulateProcessing(documentId, fileName), 3000);

  return {
    document_id: documentId,
    upload_url: 'demo://local-storage',
    expires_in: 300,
  };
}

function simulateProcessing(documentId: string, fileName: string): void {
  const doc = _demoDocuments.find(d => d.document_id === documentId);
  if (!doc) return;

  doc.processing_status = 'PROCESSING';
  doc.updated_at = new Date().toISOString();

  setTimeout(() => {
    const doc = _demoDocuments.find(d => d.document_id === documentId);
    if (!doc) return;

    // Classify based on filename
    const lower = fileName.toLowerCase();
    let classification = classifyByFilename(lower, fileName);

    doc.processing_status = 'PROCESSED';
    doc.document_type = classification.type;
    doc.title = classification.title;
    doc.issuer = classification.issuer;
    doc.keywords = classification.keywords;
    doc.skills = classification.skills;
    doc.processing_confidence = classification.confidence;
    doc.updated_at = new Date().toISOString();
  }, 4000);
}

function classifyByFilename(lower: string, originalFileName: string = ''): {
  type: DocumentType;
  title: string;
  issuer: string | null;
  keywords: string[];
  skills: string[];
  confidence: number;
} {
  if (lower.includes('certificate') || lower.includes('cert')) {
    return { type: 'CERTIFICATE', title: 'Certificate', issuer: null, keywords: ['Certificate'], skills: [], confidence: 0.75 };
  }
  if (lower.includes('internship') || lower.includes('intern')) {
    return { type: 'INTERNSHIP', title: 'Internship Certificate', issuer: null, keywords: ['Internship'], skills: [], confidence: 0.78 };
  }
  if (lower.includes('mark') || lower.includes('result') || lower.includes('grade')) {
    return { type: 'MARK_SHEET', title: 'Mark Sheet', issuer: null, keywords: ['Marks', 'Grades'], skills: [], confidence: 0.72 };
  }
  if (lower.includes('resume') || lower.includes('cv')) {
    return { type: 'RESUME', title: 'Resume / CV', issuer: null, keywords: ['Resume'], skills: [], confidence: 0.80 };
  }
  if (lower.includes('aadhar') || lower.includes('pan') || lower.includes('passport') || lower.includes('id')) {
    return { type: 'ID_DOCUMENT', title: 'Identity Document', issuer: null, keywords: ['ID'], skills: [], confidence: 0.70 };
  }
  if (lower.includes('course') || lower.includes('coursera') || lower.includes('udemy')) {
    return { type: 'COURSE_COMPLETION', title: 'Course Certificate', issuer: null, keywords: ['Course'], skills: [], confidence: 0.73 };
  }
  if (lower.includes('recommend') || lower.includes('reference') || lower.includes('letter')) {
    return { type: 'RECOMMENDATION_LETTER', title: 'Recommendation Letter', issuer: null, keywords: ['Recommendation'], skills: [], confidence: 0.71 };
  }
  if (lower.includes('achievement') || lower.includes('award') || lower.includes('winner')) {
    return { type: 'ACHIEVEMENT', title: 'Achievement', issuer: null, keywords: ['Achievement', 'Award'], skills: [], confidence: 0.74 };
  }
  const fallbackTitle = originalFileName ? originalFileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') : 'Document';
  return { type: 'OTHER', title: fallbackTitle, issuer: null, keywords: [], skills: [], confidence: 0.30 };
}

export function demoDeleteDocument(documentId: string): void {
  if (!_currentUser) throw new Error('Not authenticated');
  const idx = _demoDocuments.findIndex(d => d.document_id === documentId && d.user_id === _currentUser!.userId);
  if (idx === -1) throw new Error('Document not found');
  _demoDocuments.splice(idx, 1);
}

export function demoSearchDocuments(query: string, type?: string, expiryFilter?: string): Document[] {
  let results = demoGetDocuments();

  if (type) {
    results = results.filter(d => d.document_type === type);
  }

  if (expiryFilter) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    results = results.filter(d => {
      if (!d.expiry_date) return expiryFilter === 'no_expiry';
      const expiry = new Date(d.expiry_date);
      if (expiryFilter === 'expired') return expiry < now;
      if (expiryFilter === 'expiring') return expiry >= now && expiry <= thirtyDays;
      if (expiryFilter === 'valid') return expiry > thirtyDays;
      return true;
    });
  }

  if (query.trim()) {
    const lower = query.toLowerCase();
    results = results.filter(d => {
      const searchable = [
        d.file_name, d.title, d.issuer, d.person_name, d.document_type,
        ...(d.keywords || []), ...(d.skills || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return searchable.includes(lower);
    });
  }

  return results;
}

export function demoGetAdminStats() {
  const allDocs = _demoDocuments;
  const byCategory: Record<string, number> = {};
  for (const doc of allDocs) {
    byCategory[doc.document_type] = (byCategory[doc.document_type] || 0) + 1;
  }
  return {
    total_documents: allDocs.length + 846,
    total_users: 120,
    processed: allDocs.filter(d => d.processing_status === 'PROCESSED').length + 821,
    processing_failed: allDocs.filter(d => d.processing_status === 'PROCESSING_FAILED').length + 25,
    by_category: { ...byCategory, CERTIFICATE: (byCategory.CERTIFICATE || 0) + 200 },
    recent_activity: allDocs.slice(0, 5).map(d => ({
      document_id: d.document_id,
      document_type: d.document_type,
      processing_status: d.processing_status,
      created_at: d.created_at,
    })),
  };
}
