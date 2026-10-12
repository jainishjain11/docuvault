/**
 * createUploadUrl Lambda
 * POST /documents/upload-url
 * 
 * Authenticates user, validates file info, generates a doc ID,
 * creates an initial DynamoDB record, and returns a pre-signed S3 URL.
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const shared = (mod) => {
  try { return require(`./shared/${mod}`); }
  catch {
    try { return require(`../../shared/${mod}`); }
    catch { return require(`../shared/${mod}`); }
  }
};
const {
  generateDocumentId,
  generateS3Key,
  isAllowedContentType,
  respond,
  extractUserFromEvent,
} = shared('utils');
const { putDocument } = shared('dynamodb');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-2' });
const BUCKET = process.env.S3_BUCKET || 'docuvault-storage-jainish';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '20') * 1024 * 1024;
const URL_EXPIRY_SECONDS = 300;

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') {
    return respond(200, {});
  }

  try {
    // Extract authenticated user
    const user = extractUserFromEvent(event);
    if (!user) {
      return respond(401, { error: 'Unauthorized' });
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return respond(400, { error: 'Invalid request body' });
    }

    const { file_name, content_type, file_size } = body;

    // Validate inputs
    if (!file_name || typeof file_name !== 'string') {
      return respond(400, { error: 'file_name is required' });
    }
    if (!content_type) {
      return respond(400, { error: 'content_type is required' });
    }
    if (!isAllowedContentType(content_type)) {
      return respond(400, { error: 'Unsupported file type. Allowed: PDF, JPG, PNG' });
    }
    if (file_size && file_size > MAX_FILE_SIZE) {
      return respond(400, { error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` });
    }

    // Generate document ID and S3 key
    const documentId = generateDocumentId();
    const s3Key = generateS3Key(user.userId, documentId, `original_${file_name}`);

    // Create pre-signed upload URL
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      ContentType: content_type,
    });

    const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: URL_EXPIRY_SECONDS });

    // Create initial DynamoDB record
    const now = new Date().toISOString();
    await putDocument({
      userId: user.userId,
      documentId,
      file_name,
      content_type,
      s3_key: s3Key,
      s3_bucket: BUCKET,
      processing_status: 'UPLOADED',
      document_type: 'OTHER',
      title: null,
      issuer: null,
      person_name: null,
      issue_date: null,
      expiry_date: null,
      keywords: [],
      skills: [],
      processing_confidence: 0,
      created_at: now,
      updated_at: now,
    });

    console.log(`[createUploadUrl] Created doc ${documentId} for user ${user.userId}`);

    return respond(200, {
      document_id: documentId,
      upload_url: uploadUrl,
      expires_in: URL_EXPIRY_SECONDS,
      s3_key: s3Key,
    });

  } catch (error) {
    console.error('[createUploadUrl] Error:', error);
    return respond(500, { error: 'Internal server error', details: error.message });
  }
};
