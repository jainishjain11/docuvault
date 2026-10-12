/**
 * deleteDocument Lambda
 * DELETE /documents/{document_id}
 * 
 * Verifies ownership, deletes S3 object and DynamoDB record, writes audit log.
 */

const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const shared = (mod) => {
  try { return require(`./shared/${mod}`); }
  catch {
    try { return require(`../../shared/${mod}`); }
    catch { return require(`../shared/${mod}`); }
  }
};
const { respond, extractUserFromEvent, isValidDocumentId } = shared('utils');
const { getDocument, deleteDocument } = shared('dynamodb');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-2' });

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

    // Fetch and verify ownership
    const doc = await getDocument(user.userId, documentId);
    if (!doc) {
      return respond(404, { error: 'Document not found' });
    }
    if (doc.user_id !== user.userId) {
      return respond(403, { error: 'Access denied' });
    }

    // Delete from S3
    if (doc.s3_key && doc.s3_bucket) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: doc.s3_bucket,
          Key: doc.s3_key,
        }));
        console.log(`[deleteDocument] Deleted S3 object: ${doc.s3_key}`);
      } catch (s3Err) {
        console.warn('[deleteDocument] S3 deletion failed (continuing):', s3Err.message);
      }
    }

    // Delete from DynamoDB
    await deleteDocument(user.userId, documentId);

    // Audit log
    console.log(JSON.stringify({
      event: 'DOCUMENT_DELETED',
      documentId,
      userId: user.userId,
      fileName: doc.file_name,
      timestamp: new Date().toISOString(),
    }));

    return respond(200, { message: 'Document deleted successfully', document_id: documentId });

  } catch (error) {
    console.error('[deleteDocument] Error:', error);
    return respond(500, { error: 'Failed to delete document' });
  }
};
