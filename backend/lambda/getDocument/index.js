/**
 * getDocument Lambda
 * GET /documents/{document_id}
 * 
 * Returns metadata and a short-lived signed download URL for a document.
 */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const shared = (mod) => {
  try { return require(`./shared/${mod}`); }
  catch {
    try { return require(`../../shared/${mod}`); }
    catch { return require(`../shared/${mod}`); }
  }
};
const { respond, extractUserFromEvent, isValidDocumentId } = shared('utils');
const { getDocument } = shared('dynamodb');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-2' });
const DOWNLOAD_URL_EXPIRY = 3600; // 1 hour

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return respond(200, {});

  try {
    const user = extractUserFromEvent(event);
    if (!user) return respond(401, { error: 'Unauthorized' });

    const documentId = event.pathParameters?.document_id;
    if (!documentId || !isValidDocumentId(documentId)) {
      return respond(400, { error: 'Invalid document ID' });
    }

    // Fetch document record
    const doc = await getDocument(user.userId, documentId);
    if (!doc) {
      return respond(404, { error: 'Document not found' });
    }

    // Verify ownership (defense in depth)
    if (doc.user_id !== user.userId) {
      return respond(403, { error: 'Access denied' });
    }

    // Generate signed download URL if S3 key is set
    let downloadUrl = null;
    if (doc.s3_key && doc.s3_bucket) {
      const getCmd = new GetObjectCommand({
        Bucket: doc.s3_bucket,
        Key: doc.s3_key,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(doc.file_name)}"`,
      });
      downloadUrl = await getSignedUrl(s3, getCmd, { expiresIn: DOWNLOAD_URL_EXPIRY });
    }

    const { PK, SK, extracted_text, ...docData } = doc;

    return respond(200, {
      document: {
        ...docData,
        download_url: downloadUrl,
        download_url_expires_in: DOWNLOAD_URL_EXPIRY,
      },
    });

  } catch (error) {
    console.error('[getDocument] Error:', error);
    return respond(500, { error: 'Failed to retrieve document' });
  }
};
