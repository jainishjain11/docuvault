/**
 * listDocuments Lambda
 * GET /documents
 * 
 * Returns all documents for the authenticated user.
 */

const shared = (mod) => {
  try { return require(`./shared/${mod}`); }
  catch {
    try { return require(`../../shared/${mod}`); }
    catch { return require(`../shared/${mod}`); }
  }
};
const { respond, extractUserFromEvent } = shared('utils');
const { listDocuments } = shared('dynamodb');

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return respond(200, {});

  try {
    const user = extractUserFromEvent(event);
    if (!user) return respond(401, { error: 'Unauthorized' });

    const documents = await listDocuments(user.userId);

    // Strip internal DynamoDB keys (PK/SK) before returning
    const cleaned = documents.map(({ PK, SK, ...rest }) => rest);

    return respond(200, { documents: cleaned, count: cleaned.length });
  } catch (error) {
    console.error('[listDocuments] Error:', error);
    return respond(500, { error: 'Failed to list documents' });
  }
};
