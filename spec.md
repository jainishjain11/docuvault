# DocuVault --- Project Specification

## 1. Project Name

**DocuVault --- Smart College Document Assistant**

### One-line description

A secure cloud platform that automatically stores, understands,
organizes, searches, and monitors student academic documents.

------------------------------------------------------------------------

## 2. Problem Statement

Students accumulate certificates, mark sheets, internship documents,
resumes, identity documents, course certificates, and other academic
records. These files are commonly scattered across phones, laptops,
email, messaging applications, and cloud drives.

Traditional file storage solves only the storage problem.

DocuVault adds an intelligent organization layer that extracts useful
information from documents and turns unstructured files into searchable
records.

------------------------------------------------------------------------

## 3. Objectives

The system must:

1.  Allow authenticated students to upload documents.
2.  Store original documents securely in Amazon S3.
3.  Generate a unique document record.
4.  Process uploaded documents asynchronously.
5.  Extract text from supported documents.
6.  Classify documents into useful categories.
7.  Extract selected metadata.
8.  Store metadata in DynamoDB.
9.  Allow users to search and filter documents.
10. Allow secure document retrieval.
11. Track document processing status.
12. Identify documents with upcoming expiry dates.
13. Provide notifications/reminders where supported.
14. Provide an administrative dashboard.
15. Record application errors and processing failures.
16. Enforce user-level authorization.

------------------------------------------------------------------------

## 4. User Roles

### Student

A student can:

-   Create an account
-   Log in
-   Upload documents
-   View own documents
-   Search own documents
-   Filter by type/date
-   View extracted metadata
-   Download/view documents
-   Delete own documents
-   See processing status
-   See upcoming expiries

### Administrator

An administrator can:

-   View system statistics
-   View processing counts
-   View failed processing jobs
-   View authorized administrative information
-   Monitor system health

Administrators should not automatically receive unrestricted access to
private documents unless explicitly required by the project.

------------------------------------------------------------------------

## 5. Document Categories

Initial categories:

-   Certificate
-   Mark Sheet
-   Internship
-   Resume
-   ID Document
-   Course Completion
-   Achievement
-   Recommendation Letter
-   Other

The classifier should fall back to `OTHER` when confidence is too low.

------------------------------------------------------------------------

## 6. Functional Requirements

### FR-01 Authentication

The system shall authenticate users before allowing access to private
documents.

### FR-02 Upload

The system shall allow authenticated users to upload supported files.

Initial supported formats:

-   PDF
-   JPG/JPEG
-   PNG

Maximum file size should be configured according to the deployment
environment.

### FR-03 Secure storage

Original files shall be stored in a private S3 bucket.

### FR-04 Document ID

Every uploaded document shall receive a unique ID.

Example:

``` text
DOC-2026-000001
```

### FR-05 Processing

After upload, the document shall enter an asynchronous processing
pipeline.

### FR-06 Text extraction

The system shall attempt to extract readable text from supported
documents.

### FR-07 Classification

The system shall assign a document category.

Example:

``` text
AWS certificate
→ CERTIFICATE
```

### FR-08 Metadata extraction

Where available, the system should extract:

-   Document title
-   Organization/issuer
-   Person name
-   Issue date
-   Expiry date
-   Skills/keywords

### FR-09 Confidence

The processing result should contain a confidence value or
processing-quality status.

### FR-10 Search

Users shall be able to search their documents using metadata and
extracted keywords.

Examples:

``` text
"Python"
"internship"
"AWS"
"2026"
```

### FR-11 Filtering

Users shall be able to filter by:

-   Document type
-   Issuer
-   Upload date
-   Issue date
-   Expiry status

### FR-12 Secure retrieval

Documents shall be accessed through authenticated requests and
short-lived signed URLs rather than public S3 URLs.

### FR-13 Expiry monitoring

The system shall identify documents approaching their expiry date.

### FR-14 Notification

The system should notify users when configured expiry thresholds are
reached.

Example:

``` text
Your document "AWS Certificate"
expires in 30 days.
```

### FR-15 Processing states

Each document shall expose a processing state:

``` text
UPLOADED
PROCESSING
PROCESSED
PROCESSING_FAILED
```

### FR-16 Retry

Failed document processing should be retryable.

### FR-17 Delete

Authenticated users shall be able to delete their own document records
and corresponding objects, subject to the project's retention policy.

### FR-18 Dashboard

The student dashboard should show:

-   Total documents
-   Documents by category
-   Recently uploaded documents
-   Processing failures
-   Upcoming expiries

### FR-19 Admin statistics

The admin dashboard should show:

-   Total users
-   Total documents
-   Documents processed
-   Processing failures
-   Documents by category
-   Recent system activity

------------------------------------------------------------------------

## 7. Non-Functional Requirements

### NFR-01 Security

No uploaded document should be publicly accessible.

### NFR-02 Availability

The system should continue functioning if a single document-processing
request fails.

### NFR-03 Scalability

The architecture should use serverless components where practical so
that processing can scale with demand.

### NFR-04 Performance

Normal metadata/search operations should respond quickly enough for an
interactive web application.

### NFR-05 Reliability

Processing failures must be recorded and visible to the system rather
than silently ignored.

### NFR-06 Maintainability

Frontend, API, processing, storage, and data layers should remain
logically separated.

### NFR-07 Observability

Lambda execution errors and important processing events should be
available in CloudWatch logs.

### NFR-08 Privacy

A student must not be able to retrieve another student's private
document through normal application APIs.

------------------------------------------------------------------------

## 8. Suggested API

### Authentication

Handled primarily through Cognito.

### Upload

``` http
POST /documents/upload-url
```

Request:

``` json
{
  "file_name": "certificate.pdf",
  "content_type": "application/pdf"
}
```

Response:

``` json
{
  "document_id": "DOC-2026-000001",
  "upload_url": "SIGNED_URL",
  "expires_in": 300
}
```

### List documents

``` http
GET /documents
```

### Get document

``` http
GET /documents/{document_id}
```

### Search

``` http
GET /documents/search?q=python
```

### Delete

``` http
DELETE /documents/{document_id}
```

### Admin statistics

``` http
GET /admin/statistics
```

------------------------------------------------------------------------

## 9. DynamoDB Specification

Recommended table:

``` text
DocuVaultDocuments
```

Primary key design can use:

``` text
PK = USER#{user_id}
SK = DOC#{document_id}
```

Example:

``` text
PK: USER#U001
SK: DOC#D001
```

Useful attributes:

``` text
document_id
user_id
file_name
document_type
title
issuer
person_name
issue_date
expiry_date
keywords
skills
s3_key
processing_status
processing_confidence
created_at
updated_at
```

Potential secondary indexes should be added only for access patterns
that are actually required.

------------------------------------------------------------------------

## 10. S3 Specification

Bucket:

``` text
docuvault-private-documents
```

Recommended object structure:

``` text
documents/{user_id}/{document_id}/original
documents/{user_id}/{document_id}/extracted.json
```

Security:

-   Block public access
-   Encrypt stored objects
-   Use IAM permissions
-   Use pre-signed URLs for controlled access

------------------------------------------------------------------------

## 11. Lambda Functions

### `createUploadUrl`

Responsibilities:

-   Authenticate user
-   Validate filename/content type
-   Generate document ID
-   Store initial DynamoDB record
-   Return pre-signed upload URL

### `processDocument`

Triggered by S3.

Responsibilities:

-   Validate object
-   Extract text
-   Classify document
-   Extract metadata
-   Update DynamoDB
-   Record failure state if processing fails

### `listDocuments`

Responsibilities:

-   Verify authenticated user
-   Query that user's documents
-   Return metadata

### `searchDocuments`

Responsibilities:

-   Validate query
-   Search supported metadata/indexes
-   Return matching documents

### `getDocument`

Responsibilities:

-   Verify ownership
-   Generate secure access URL
-   Return metadata and URL

### `deleteDocument`

Responsibilities:

-   Verify ownership
-   Delete S3 object
-   Delete/update DynamoDB record
-   Write audit log

### `sendExpiryNotifications`

Responsibilities:

-   Find documents approaching expiry
-   Send notifications
-   Avoid duplicate notifications

### `adminStatistics`

Responsibilities:

-   Return approved aggregate statistics
-   Never expose private documents unnecessarily

------------------------------------------------------------------------

## 12. Processing Pipeline

``` text
Upload
  ↓
S3
  ↓
S3 Event
  ↓
processDocument Lambda
  ↓
Text/OCR extraction
  ↓
Document classification
  ↓
Metadata extraction
  ↓
Validation
  ↓
DynamoDB update
  ↓
PROCESSED
```

Failure:

``` text
Processing error
  ↓
CloudWatch log
  ↓
PROCESSING_FAILED
  ↓
Retry available
```

------------------------------------------------------------------------

## 13. AI / Intelligent Layer

### Minimum intelligent implementation

Use extracted text + rules/keyword scoring.

Example:

``` text
"certificate", "completed", "achievement"
→ Certificate

"internship", "worked at", "duration"
→ Internship

"semester", "marks", "grade"
→ Mark Sheet
```

### Advanced implementation

If approved and feasible, use an AI service to:

-   Summarize documents
-   Extract structured information
-   Suggest document category
-   Answer questions about a user's own documents

Example:

> "Which certificates do I have related to cloud computing?"

The assistant should answer from the user's indexed documents only.

------------------------------------------------------------------------

## 14. Error Handling

The system must handle:

-   Unsupported file type
-   Oversized file
-   Empty file
-   OCR failure
-   Corrupt PDF/image
-   AI/classification failure
-   DynamoDB failure
-   S3 failure
-   Unauthorized access
-   Missing document
-   Expired signed URL

User-facing errors should be understandable.

Example:

``` text
We couldn't process this document.
The file is stored safely, but automatic extraction failed.
Try processing it again.
```

------------------------------------------------------------------------

## 15. Testing Plan

### Unit tests

Test:

-   Document ID generation
-   Classification rules
-   Metadata validation
-   Expiry calculation
-   Authorization checks

### Integration tests

Test:

``` text
Frontend
→ API Gateway
→ Lambda
→ S3
→ Processing Lambda
→ DynamoDB
```

### Security tests

Verify:

1.  User A cannot access User B's document.
2.  S3 bucket is not public.
3.  Invalid document IDs are rejected.
4.  Admin endpoints require admin privileges.
5.  Signed URLs expire.

### Failure tests

Simulate:

-   Invalid file
-   Processing exception
-   Missing S3 object
-   DynamoDB failure

Verify that the system reports `PROCESSING_FAILED` and logs the failure.

------------------------------------------------------------------------

## 16. Final Demonstration Script

### Demo 1 --- Upload

Login as student.

Upload:

``` text
AWS_Cloud_Certificate.pdf
```

Show:

``` text
Uploading...
Processing...
Processed ✓
```

### Demo 2 --- Automatic understanding

Open document details:

``` text
Type: Certificate
Issuer: AWS
Keywords: Cloud, AWS
Issue Date: 2026-08-20
Status: Valid
```

### Demo 3 --- Search

Search:

``` text
cloud
```

The uploaded certificate appears.

### Demo 4 --- Expiry

Show a document with an upcoming expiry.

Dashboard displays:

``` text
⚠ 2 documents expire within 30 days
```

### Demo 5 --- Security

Attempt to access another user's document.

Expected:

``` text
403 Unauthorized
```

### Demo 6 --- Admin

Open admin dashboard:

``` text
Users: 120
Documents: 846
Processed: 821
Failed: 25
```

This gives the faculty a visible end-to-end demonstration of cloud
storage, serverless processing, database management, intelligent
extraction, security, and analytics.

------------------------------------------------------------------------

## 17. Future Scope

Possible future improvements:

-   Semantic/vector search
-   AI document Q&A
-   Automatic resume skill extraction
-   Duplicate document detection
-   Document versioning
-   Mobile application
-   Institution-wide document verification
-   Digital signature verification
-   Multi-language OCR
-   Advanced analytics

These should remain future scope unless time permits. The core project
should be completed first.

------------------------------------------------------------------------

## 18. Success Criteria

The project is considered complete when:

-   A user can securely log in.
-   A user can upload a document.
-   The file reaches private S3 storage.
-   S3 triggers processing.
-   The document is classified/extracted.
-   Metadata is stored in DynamoDB.
-   The user can search and retrieve the document.
-   Expiry information is displayed.
-   Unauthorized document access is blocked.
-   Processing failures are logged and visible.
-   The complete workflow can be demonstrated live.
