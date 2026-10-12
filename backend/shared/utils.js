/**
 * DocuVault - Document ID Generator
 * Generates sequential IDs in format DOC-YYYY-NNNNNN.
 */

const { randomUUID } = require('crypto');

/**
 * Generate a unique document ID using timestamp + random suffix.
 * Format: DOC-2026-A1B2C3 (year + 6-char hex suffix for uniqueness)
 */
function generateDocumentId() {
  const year = new Date().getFullYear();
  const suffix = randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
  return `DOC-${year}-${suffix}`;
}

/**
 * Validate that a document ID matches the expected format.
 */
function isValidDocumentId(id) {
  return /^DOC-\d{4}-[A-Z0-9]{6}$/.test(id);
}

/**
 * Generate an S3 key for a document.
 */
function generateS3Key(userId, documentId, suffix = 'original') {
  return `documents/${userId}/${documentId}/${suffix}`;
}

/**
 * Validate file type based on content-type header.
 */
function isAllowedContentType(contentType) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  return allowed.includes(contentType?.toLowerCase());
}

/**
 * Get file extension from content type.
 */
function getExtensionFromContentType(contentType) {
  const map = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
  };
  return map[contentType?.toLowerCase()] || '';
}

/**
 * Calculate days until expiry date.
 */
function daysUntilExpiry(expiryDateStr) {
  if (!expiryDateStr) return null;
  try {
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

/**
 * Standard Lambda response helper.
 */
function respond(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

/**
 * Extract user info from Cognito authorizer context.
 */
function extractUserFromEvent(event) {
  const ctx = event.requestContext?.authorizer?.claims || event.requestContext?.authorizer?.jwt?.claims;
  if (!ctx) return null;
  const rawGroups = ctx['cognito:groups'] || ctx.groups || [];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : (typeof rawGroups === 'string' ? rawGroups.split(',').map(g => g.trim()).filter(Boolean) : []);
  const isAdmin = groups.some(g => ['admins', 'admin'].includes(String(g).toLowerCase())) ||
    ctx['custom:role'] === 'admin';

  return {
    userId: ctx.sub || ctx['cognito:username'] || ctx.username,
    email: ctx.email,
    groups,
    isAdmin,
  };
}

module.exports = {
  generateDocumentId,
  isValidDocumentId,
  generateS3Key,
  isAllowedContentType,
  getExtensionFromContentType,
  daysUntilExpiry,
  respond,
  extractUserFromEvent,
};
