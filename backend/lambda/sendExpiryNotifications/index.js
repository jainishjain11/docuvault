/**
 * sendExpiryNotifications Lambda
 * Scheduled (EventBridge) - runs daily.
 * 
 * Scans documents for upcoming expiry and sends SNS/SES notifications.
 */

const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const shared = (mod) => {
  try { return require(`./shared/${mod}`); }
  catch {
    try { return require(`../../shared/${mod}`); }
    catch { return require(`../shared/${mod}`); }
  }
};
const dynamodb = shared('dynamodb');

const EXPIRY_THRESHOLD_DAYS = parseInt(process.env.EXPIRY_THRESHOLD_DAYS || '30', 10);

let snsClient = null;
function getSnsClient() {
  if (!snsClient) {
    snsClient = new SNSClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });
  }
  return snsClient;
}

exports.handler = async () => {
  console.log('[sendExpiryNotifications] Starting expiry check');

  const snsTopicArn = (process.env.SNS_TOPIC_ARN || '').trim();
  const isTopicConfigured = Boolean(
    snsTopicArn &&
    snsTopicArn !== 'undefined' &&
    snsTopicArn !== 'null'
  );

  try {
    const allDocs = await dynamodb.scanAllDocuments(2000);
    const now = new Date();
    const threshold = new Date(now.getTime() + EXPIRY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

    const expiringDocs = allDocs.filter(doc => {
      if (!doc.expiry_date) return false;
      const expiry = new Date(doc.expiry_date);
      return expiry >= now && expiry <= threshold;
    });

    console.log(`[sendExpiryNotifications] Found ${expiringDocs.length} expiring documents`);

    if (!isTopicConfigured) {
      console.warn('[sendExpiryNotifications] SNS_TOPIC_ARN not configured, logging only');
      for (const doc of expiringDocs) {
        const daysLeft = Math.ceil((new Date(doc.expiry_date) - now) / (1000 * 60 * 60 * 24));
        console.log(`EXPIRY_ALERT: doc=${doc.document_id} user=${doc.user_id} expires_in=${daysLeft}days file=${doc.file_name}`);
      }
      return { notified: 0, logged: expiringDocs.length };
    }

    let notified = 0;
    const sns = getSnsClient();
    for (const doc of expiringDocs) {
      const daysLeft = Math.ceil((new Date(doc.expiry_date) - now) / (1000 * 60 * 60 * 24));

      try {
        await sns.send(new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: `DocuVault: Document Expiring in ${daysLeft} days`,
          Message: JSON.stringify({
            userId: doc.user_id,
            documentId: doc.document_id,
            fileName: doc.file_name,
            documentType: doc.document_type,
            expiryDate: doc.expiry_date,
            daysUntilExpiry: daysLeft,
            message: `Your document "${doc.file_name}" expires in ${daysLeft} days (${doc.expiry_date}).`,
          }),
          MessageAttributes: {
            userId: { DataType: 'String', StringValue: doc.user_id },
            eventType: { DataType: 'String', StringValue: 'EXPIRY_NOTIFICATION' },
          },
        }));
        notified++;
      } catch (snsErr) {
        console.error(`[sendExpiryNotifications] SNS failed for doc ${doc.document_id}:`, snsErr.message);
      }
    }

    console.log(`[sendExpiryNotifications] Sent ${notified} notifications`);
    return { notified, total_expiring: expiringDocs.length };

  } catch (error) {
    console.error('[sendExpiryNotifications] Error:', error);
    throw error;
  }
};
