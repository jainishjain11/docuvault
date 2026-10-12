/**
 * adminStats Lambda
 * GET /admin/statistics
 * 
 * Returns aggregate statistics. Admin role required.
 */

const shared = (mod) => {
  try { return require(`./shared/${mod}`); }
  catch {
    try { return require(`../../shared/${mod}`); }
    catch { return require(`../shared/${mod}`); }
  }
};
const { respond, extractUserFromEvent } = shared('utils');
const { scanAllDocuments } = shared('dynamodb');

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return respond(200, {});

  try {
    const user = extractUserFromEvent(event);
    if (!user) return respond(401, { error: 'Unauthorized' });
    if (!user.isAdmin) return respond(403, { error: 'Admin access required' });

    const allDocs = await scanAllDocuments(1000);

    const stats = {
      total_documents: allDocs.length,
      total_users: new Set(allDocs.map(d => d.user_id)).size,
      processed: allDocs.filter(d => d.processing_status === 'PROCESSED').length,
      processing_failed: allDocs.filter(d => d.processing_status === 'PROCESSING_FAILED').length,
      uploaded: allDocs.filter(d => d.processing_status === 'UPLOADED').length,
      processing: allDocs.filter(d => d.processing_status === 'PROCESSING').length,
      by_category: {},
      recent_activity: [],
    };

    // Count by category
    for (const doc of allDocs) {
      const type = doc.document_type || 'OTHER';
      stats.by_category[type] = (stats.by_category[type] || 0) + 1;
    }

    // Recent activity (last 10 docs, no private content)
    stats.recent_activity = allDocs
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(d => ({
        document_id: d.document_id,
        document_type: d.document_type,
        processing_status: d.processing_status,
        created_at: d.created_at,
      }));

    return respond(200, { statistics: stats });

  } catch (error) {
    console.error('[adminStats] Error:', error);
    return respond(500, { error: 'Failed to retrieve statistics' });
  }
};
