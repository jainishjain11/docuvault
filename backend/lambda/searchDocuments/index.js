/**
 * searchDocuments Lambda
 * GET /documents/search?q=query&type=CERTIFICATE&expiry_status=expiring
 * 
 * Searches user's documents across metadata and extracted text.
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

    const params = event.queryStringParameters || {};
    const query = (params.q || '').toLowerCase().trim();
    const typeFilter = params.type?.toUpperCase();
    const expiryFilter = params.expiry_status; // 'expiring', 'expired', 'valid'
    const dateFrom = params.date_from;
    const dateTo = params.date_to;

    // Fetch all user documents (search is client-side for demo; DynamoDB full-text search needs OpenSearch)
    const allDocs = await listDocuments(user.userId, 500);

    let results = allDocs.map(({ PK, SK, ...rest }) => rest);

    // Filter by type
    if (typeFilter) {
      results = results.filter(d => d.document_type === typeFilter);
    }

    // Filter by expiry status
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

    // Filter by date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      results = results.filter(d => d.created_at && new Date(d.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      results = results.filter(d => d.created_at && new Date(d.created_at) <= to);
    }

    // Full-text search across metadata
    if (query) {
      results = results.filter(doc => {
        const searchable = [
          doc.file_name,
          doc.title,
          doc.issuer,
          doc.person_name,
          doc.document_type,
          ...(doc.keywords || []),
          ...(doc.skills || []),
        ].filter(Boolean).join(' ').toLowerCase();

        return searchable.includes(query);
      });
    }

    // Sort by created_at descending
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return respond(200, {
      documents: results,
      count: results.length,
      query: params.q || '',
      filters: { type: typeFilter, expiry_status: expiryFilter },
    });

  } catch (error) {
    console.error('[searchDocuments] Error:', error);
    return respond(500, { error: 'Search failed' });
  }
};
