/**
 * DocuVault - Backend Unit Tests
 * Tests for classifier, metadata extractor, and utility functions.
 */

const { classifyDocument, extractMetadata } = require('../shared/classifier');
const {
  generateDocumentId,
  isValidDocumentId,
  generateS3Key,
  isAllowedContentType,
  daysUntilExpiry,
} = require('../shared/utils');

// =============================
// Document ID Tests
// =============================
describe('generateDocumentId', () => {
  test('generates ID in correct format', () => {
    const id = generateDocumentId();
    expect(id).toMatch(/^DOC-\d{4}-[A-Z0-9]{6}$/);
  });

  test('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateDocumentId()));
    expect(ids.size).toBe(100);
  });

  test('contains current year', () => {
    const id = generateDocumentId();
    const year = new Date().getFullYear().toString();
    expect(id).toContain(year);
  });
});

describe('isValidDocumentId', () => {
  test('accepts valid ID', () => {
    expect(isValidDocumentId('DOC-2026-AB1234')).toBe(true);
    expect(isValidDocumentId('DOC-2025-FFFFFF')).toBe(true);
    expect(isValidDocumentId('DOC-2030-000000')).toBe(true);
  });

  test('rejects invalid IDs', () => {
    expect(isValidDocumentId(null)).toBe(false);
    expect(isValidDocumentId('')).toBe(false);
    expect(isValidDocumentId('DOC-26-AB1234')).toBe(false);
    expect(isValidDocumentId('doc-2026-AB1234')).toBe(false);
    expect(isValidDocumentId('DOC-2026-TOOLONG')).toBe(false);
    expect(isValidDocumentId('DOC-2026-!@#$%^')).toBe(false);
    expect(isValidDocumentId('RANDOM')).toBe(false);
  });
});

// =============================
// S3 Key Tests
// =============================
describe('generateS3Key', () => {
  test('generates correct S3 key format', () => {
    const key = generateS3Key('user123', 'DOC-2026-ABC123');
    expect(key).toBe('documents/user123/DOC-2026-ABC123/original');
  });

  test('accepts custom suffix', () => {
    const key = generateS3Key('user123', 'DOC-2026-ABC123', 'extracted.json');
    expect(key).toBe('documents/user123/DOC-2026-ABC123/extracted.json');
  });
});

// =============================
// File Type Validation Tests
// =============================
describe('isAllowedContentType', () => {
  test('accepts PDF', () => {
    expect(isAllowedContentType('application/pdf')).toBe(true);
  });

  test('accepts JPEG', () => {
    expect(isAllowedContentType('image/jpeg')).toBe(true);
    expect(isAllowedContentType('image/jpg')).toBe(true);
  });

  test('accepts PNG', () => {
    expect(isAllowedContentType('image/png')).toBe(true);
  });

  test('rejects unsupported types', () => {
    expect(isAllowedContentType('text/plain')).toBe(false);
    expect(isAllowedContentType('video/mp4')).toBe(false);
    expect(isAllowedContentType('application/zip')).toBe(false);
    expect(isAllowedContentType(null)).toBe(false);
    expect(isAllowedContentType(undefined)).toBe(false);
  });
});

// =============================
// Expiry Calculation Tests
// =============================
describe('daysUntilExpiry', () => {
  test('returns null for null input', () => {
    expect(daysUntilExpiry(null)).toBe(null);
    expect(daysUntilExpiry(undefined)).toBe(null);
    expect(daysUntilExpiry('')).toBe(null);
  });

  test('returns positive days for future date', () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const days = daysUntilExpiry(future);
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(11);
  });

  test('returns negative days for past date', () => {
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const days = daysUntilExpiry(past);
    expect(days).toBeLessThan(0);
  });
});

// =============================
// Document Classification Tests
// =============================
describe('classifyDocument', () => {
  test('classifies certificate documents', () => {
    const text = 'This is to certify that John Doe has successfully completed the AWS Cloud Practitioner certification. Awarded with distinction.';
    const result = classifyDocument(text);
    expect(result.category).toBe('CERTIFICATE');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('classifies internship documents', () => {
    const text = 'This internship certificate is awarded to Jane Smith for completing the summer internship program at ABC Technologies for a duration of 3 months.';
    const result = classifyDocument(text);
    expect(result.category).toBe('INTERNSHIP');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('classifies mark sheets', () => {
    const text = 'Semester Result\nSubject: Mathematics - Marks: 85\nSubject: Physics - Grade: A\nCGPA: 8.5\nPercentage: 85%';
    const result = classifyDocument(text);
    expect(result.category).toBe('MARK_SHEET');
  });

  test('classifies resumes', () => {
    const text = 'RESUME\nWork Experience: Software Engineer at Tech Corp\nSkills: Python, JavaScript, React\nEducation: B.Tech Computer Science\nCareer Objective: To work in a dynamic environment';
    const result = classifyDocument(text);
    expect(result.category).toBe('RESUME');
  });

  test('classifies ID documents', () => {
    const text = 'Government of India\nAadhaar Card\nUnique Identification Authority\nDate of Birth: 01/01/2000\nIdentity Card Number: 1234 5678 9012';
    const result = classifyDocument(text);
    expect(result.category).toBe('ID_DOCUMENT');
  });

  test('classifies recommendation letters', () => {
    const text = 'To Whom It May Concern,\nI recommend Mr. John Doe. It is my pleasure to recommend this outstanding student. Letter of Recommendation from Prof. Smith.';
    const result = classifyDocument(text);
    expect(result.category).toBe('RECOMMENDATION_LETTER');
  });

  test('falls back to OTHER for empty text', () => {
    const result = classifyDocument('');
    expect(result.category).toBe('OTHER');
    expect(result.confidence).toBe(0);
  });

  test('falls back to OTHER for unrecognizable text', () => {
    const result = classifyDocument('Lorem ipsum dolor sit amet consectetur adipiscing elit');
    expect(result.category).toBe('OTHER');
  });

  test('returns confidence between 0 and 1', () => {
    const result = classifyDocument('certificate awarded to student');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('returns scores object', () => {
    const result = classifyDocument('certificate');
    expect(typeof result.scores).toBe('object');
  });
});

// =============================
// Metadata Extraction Tests
// =============================
describe('extractMetadata', () => {
  test('extracts keywords from tech text', () => {
    const text = 'Completed Python and AWS Cloud computing course with machine learning modules';
    const meta = extractMetadata(text);
    expect(meta.keywords).toContain('Python');
    expect(meta.keywords).toContain('Aws');
  });

  test('returns empty arrays for no keywords', () => {
    const meta = extractMetadata('Simple text with no tech');
    expect(Array.isArray(meta.keywords)).toBe(true);
    expect(Array.isArray(meta.skills)).toBe(true);
  });

  test('returns null for null input', () => {
    const meta = extractMetadata(null);
    expect(meta).toEqual({});
  });

  test('extracts dates', () => {
    const text = 'Issued on 15/08/2026 and valid until 15/08/2028';
    const meta = extractMetadata(text);
    expect(meta.issueDate).toBeTruthy();
  });
});

// =============================
// User Authorization Helper Tests
// =============================
const { extractUserFromEvent } = require('../shared/utils');

describe('extractUserFromEvent', () => {
  test('returns null when no authorizer context is present', () => {
    expect(extractUserFromEvent({})).toBeNull();
    expect(extractUserFromEvent({ requestContext: {} })).toBeNull();
  });

  test('extracts user from REST API Cognito authorizer with array groups', () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'user-123',
            email: 'admin@college.edu',
            'cognito:groups': ['admins'],
          },
        },
      },
    };
    const user = extractUserFromEvent(event);
    expect(user).toEqual({
      userId: 'user-123',
      email: 'admin@college.edu',
      groups: ['admins'],
      isAdmin: true,
    });
  });

  test('extracts user from string cognito:groups', () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'user-456',
            email: 'student@college.edu',
            'cognito:groups': 'students',
          },
        },
      },
    };
    const user = extractUserFromEvent(event);
    expect(user.isAdmin).toBe(false);
    expect(user.userId).toBe('user-456');
  });

  test('extracts user from HTTP API JWT authorizer claims', () => {
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'jwt-user-789',
              email: 'jwt@college.edu',
              'cognito:groups': ['admin'],
            },
          },
        },
      },
    };
    const user = extractUserFromEvent(event);
    expect(user.isAdmin).toBe(true);
    expect(user.userId).toBe('jwt-user-789');
  });
});

// =============================
// DynamoDB Schema Key Tests
// =============================
const { makeKey } = require('../shared/dynamodb');

describe('DynamoDB Schema Key Format', () => {
  test('makeKey uses user_id partition key and document_id sort key', () => {
    const key = makeKey('student_123', 'DOC-2026-ABC123');
    expect(key).toEqual({
      user_id: 'student_123',
      document_id: 'DOC-2026-ABC123',
    });
  });

  test('makeKey does not produce PK/SK legacy keys', () => {
    const key = makeKey('student_123', 'DOC-2026-ABC123');
    expect(key.PK).toBeUndefined();
    expect(key.SK).toBeUndefined();
  });
});

// =============================
// Lambda Handlers Load Tests
// =============================
describe('Lambda Handlers Initialization', () => {
  const lambdas = [
    'createUploadUrl',
    'processDocument',
    'listDocuments',
    'getDocument',
    'deleteDocument',
    'searchDocuments',
    'adminStats',
    'sendExpiryNotifications',
  ];

  test.each(lambdas)('loads %s handler without throwing', (lambdaName) => {
    expect(() => {
      const mod = require(`../lambda/${lambdaName}/index`);
      expect(typeof mod.handler).toBe('function');
    }).not.toThrow();
  });
});

// =============================
// Expiry Notifications Safety Test
// =============================
describe('sendExpiryNotifications safety', () => {
  test('safely executes without SNS_TOPIC_ARN configured', async () => {
    const origArn = process.env.SNS_TOPIC_ARN;
    delete process.env.SNS_TOPIC_ARN;

    const dynamodb = require('../shared/dynamodb');
    const spy = jest.spyOn(dynamodb, 'scanAllDocuments').mockResolvedValueOnce([
      {
        document_id: 'DOC-2026-TEST01',
        user_id: 'user_123',
        file_name: 'test.pdf',
        expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    const { handler } = require('../lambda/sendExpiryNotifications/index');
    const result = await handler();
    expect(result).toEqual({ notified: 0, logged: 1 });

    spy.mockRestore();
    if (origArn !== undefined) process.env.SNS_TOPIC_ARN = origArn;
  });

  test('safely handles whitespace or undefined string SNS_TOPIC_ARN without crashing', async () => {
    const origArn = process.env.SNS_TOPIC_ARN;
    process.env.SNS_TOPIC_ARN = '   ';

    const dynamodb = require('../shared/dynamodb');
    const spy = jest.spyOn(dynamodb, 'scanAllDocuments').mockResolvedValueOnce([
      {
        document_id: 'DOC-2026-TEST02',
        user_id: 'user_456',
        file_name: 'license.png',
        expiry_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    const { handler } = require('../lambda/sendExpiryNotifications/index');
    const result = await handler();
    expect(result).toEqual({ notified: 0, logged: 1 });

    spy.mockRestore();
    if (origArn !== undefined) process.env.SNS_TOPIC_ARN = origArn;
    else delete process.env.SNS_TOPIC_ARN;
  });

  test('handles zero expiring documents gracefully', async () => {
    const origArn = process.env.SNS_TOPIC_ARN;
    delete process.env.SNS_TOPIC_ARN;

    const dynamodb = require('../shared/dynamodb');
    const spy = jest.spyOn(dynamodb, 'scanAllDocuments').mockResolvedValueOnce([]);

    const { handler } = require('../lambda/sendExpiryNotifications/index');
    const result = await handler();
    expect(result).toEqual({ notified: 0, logged: 0 });

    spy.mockRestore();
    if (origArn !== undefined) process.env.SNS_TOPIC_ARN = origArn;
  });
});


