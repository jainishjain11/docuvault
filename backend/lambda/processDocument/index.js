/**
 * processDocument Lambda
 * Triggered by S3 ObjectCreated event.
 * 
 * Extracts text (via Textract or fallback), classifies, extracts metadata,
 * and updates DynamoDB with PROCESSED or PROCESSING_FAILED status.
 */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { TextractClient, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const shared = (mod) => {
  try { return require(`./shared/${mod}`); }
  catch {
    try { return require(`../../shared/${mod}`); }
    catch { return require(`../shared/${mod}`); }
  }
};
const { classifyDocument, extractMetadata } = shared('classifier');
const { updateDocumentProcessing } = shared('dynamodb');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-2' });
const textractClient = new TextractClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });

const USE_TEXTRACT = process.env.USE_TEXTRACT !== 'false';

exports.handler = async (event) => {
  console.log('[processDocument] Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records || []) {
    const bucketName = record.s3?.bucket?.name;
    const s3Key = decodeURIComponent(record.s3?.object?.key?.replace(/\+/g, ' ') || '');

    if (!bucketName || !s3Key) {
      console.error('[processDocument] Missing bucket or key in record');
      continue;
    }

    console.log(`[processDocument] Processing s3://${bucketName}/${s3Key}`);

    // Parse userId and documentId from the key: documents/{userId}/{documentId}/original_*
    const keyParts = s3Key.split('/');
    if (keyParts.length < 4 || keyParts[0] !== 'documents') {
      console.error('[processDocument] Unexpected S3 key format:', s3Key);
      continue;
    }

    const userId = keyParts[1];
    const documentId = keyParts[2];

    try {
      // Mark as PROCESSING
      await updateDocumentProcessing(userId, documentId, {
        processing_status: 'PROCESSING',
      });

      // Extract text
      let extractedText = '';
      let extractionMethod = 'none';

      if (USE_TEXTRACT) {
        try {
          const textractResult = await textractClient.send(new DetectDocumentTextCommand({
            Document: {
              S3Object: { Bucket: bucketName, Name: s3Key },
            },
          }));

          const blocks = textractResult.Blocks || [];
          extractedText = blocks
            .filter(b => b.BlockType === 'LINE')
            .map(b => b.Text)
            .join('\n');
          extractionMethod = 'textract';
          console.log(`[processDocument] Textract extracted ${extractedText.length} chars`);
        } catch (textractErr) {
          console.warn('[processDocument] Textract failed, trying fallback:', textractErr.message);
          // Fall through to fallback
        }
      }

      // Fallback: try to extract text from filename and path context
      if (!extractedText) {
        const fileName = keyParts[keyParts.length - 1] || '';
        extractedText = fileName.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '');
        extractionMethod = 'filename_fallback';
        console.log(`[processDocument] Using filename fallback: ${extractedText}`);
      }

      // Classify document
      const classification = classifyDocument(extractedText);
      console.log(`[processDocument] Classification: ${classification.category} (confidence: ${classification.confidence})`);

      // Extract metadata
      const metadata = extractMetadata(extractedText);
      console.log(`[processDocument] Metadata:`, metadata);

      // Update DynamoDB with results
      await updateDocumentProcessing(userId, documentId, {
        processing_status: 'PROCESSED',
        document_type: classification.category,
        title: metadata.title,
        issuer: metadata.issuer,
        person_name: metadata.personName,
        issue_date: metadata.issueDate,
        expiry_date: metadata.expiryDate,
        keywords: metadata.keywords,
        skills: metadata.skills,
        processing_confidence: classification.confidence,
        extracted_text: extractedText.substring(0, 5000),
        extraction_method: extractionMethod,
      });

      console.log(`[processDocument] Successfully processed ${documentId}`);

    } catch (error) {
      console.error(`[processDocument] Failed to process ${documentId}:`, error);

      try {
        await updateDocumentProcessing(userId, documentId, {
          processing_status: 'PROCESSING_FAILED',
          processing_error: error.message,
        });
      } catch (updateErr) {
        console.error('[processDocument] Failed to update failure status:', updateErr);
      }
    }
  }
};
