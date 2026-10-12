/**
 * DocuVault - DynamoDB Helper
 * Shared utilities for DynamoDB operations.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'DocuVaultDocuments';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Create primary key for a document item (user_id PK, document_id SK).
 */
function makeKey(userId, documentId) {
  return {
    user_id: userId,
    document_id: documentId,
  };
}

/**
 * Put a new document record.
 */
async function putDocument(item) {
  const userId = item.userId || item.user_id;
  const documentId = item.documentId || item.document_id;
  const now = new Date().toISOString();
  const record = {
    user_id: userId,
    document_id: documentId,
    created_at: item.created_at || now,
    updated_at: now,
    ...item,
  };

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: record }));
  return record;
}

/**
 * Get a document record by userId and documentId.
 */
async function getDocument(userId, documentId) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: makeKey(userId, documentId),
  }));
  return result.Item || null;
}

/**
 * List all documents for a user.
 */
async function listDocuments(userId, limit = 100) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'user_id = :uid',
    ExpressionAttributeValues: {
      ':uid': userId,
    },
    Limit: limit,
    ScanIndexForward: false,
  }));
  return result.Items || [];
}

/**
 * Update document processing result.
 */
async function updateDocumentProcessing(userId, documentId, processingResult) {
  const now = new Date().toISOString();
  const {
    processing_status, document_type, title, issuer, person_name,
    issue_date, expiry_date, keywords, skills, processing_confidence,
    extracted_text,
  } = processingResult;

  const updateExpr = [
    'processing_status = :ps',
    'updated_at = :ua',
  ];
  const exprAttrVals = {
    ':ps': processing_status,
    ':ua': now,
  };

  if (document_type !== undefined) { updateExpr.push('document_type = :dt'); exprAttrVals[':dt'] = document_type; }
  if (title !== undefined) { updateExpr.push('#t = :ti'); exprAttrVals[':ti'] = title; }
  if (issuer !== undefined) { updateExpr.push('issuer = :is'); exprAttrVals[':is'] = issuer; }
  if (person_name !== undefined) { updateExpr.push('person_name = :pn'); exprAttrVals[':pn'] = person_name; }
  if (issue_date !== undefined) { updateExpr.push('issue_date = :id'); exprAttrVals[':id'] = issue_date; }
  if (expiry_date !== undefined) { updateExpr.push('expiry_date = :ed'); exprAttrVals[':ed'] = expiry_date; }
  if (keywords !== undefined) { updateExpr.push('keywords = :kw'); exprAttrVals[':kw'] = keywords; }
  if (skills !== undefined) { updateExpr.push('skills = :sk'); exprAttrVals[':sk'] = skills; }
  if (processing_confidence !== undefined) { updateExpr.push('processing_confidence = :pc'); exprAttrVals[':pc'] = processing_confidence; }
  if (extracted_text !== undefined) { updateExpr.push('extracted_text = :et'); exprAttrVals[':et'] = extracted_text.substring(0, 5000); }
  if (processingResult.processing_error !== undefined) { updateExpr.push('processing_error = :pe'); exprAttrVals[':pe'] = processingResult.processing_error; }
  if (processingResult.extraction_method !== undefined) { updateExpr.push('extraction_method = :em'); exprAttrVals[':em'] = processingResult.extraction_method; }

  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: makeKey(userId, documentId),
    UpdateExpression: `SET ${updateExpr.join(', ')}`,
    ExpressionAttributeValues: exprAttrVals,
    ExpressionAttributeNames: title !== undefined ? { '#t': 'title' } : undefined,
  }));
}

/**
 * Delete a document record.
 */
async function deleteDocument(userId, documentId) {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: makeKey(userId, documentId),
  }));
}

/**
 * Scan all documents (admin only).
 */
async function scanAllDocuments(limit = 500) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'attribute_exists(document_id)',
    Limit: limit,
  }));
  return result.Items || [];
}

module.exports = {
  makeKey,
  putDocument,
  getDocument,
  listDocuments,
  updateDocumentProcessing,
  deleteDocument,
  scanAllDocuments,
  TABLE_NAME,
};
