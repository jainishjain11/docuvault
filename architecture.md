# DocuVault --- Smart College Document Assistant

## 1. Project Overview

DocuVault is a cloud-based document management and intelligent document
assistant for students.

Students can upload certificates, mark sheets, ID documents, internship
letters, resumes, course certificates, and other academic documents. The
system stores the original files securely, extracts useful information
from documents, automatically classifies them, indexes searchable
metadata, and provides a dashboard for retrieval and document insights.

### Core value proposition

> Upload a document once. DocuVault understands what it is, extracts the
> important information, organizes it, and lets the student find it
> later using normal search.

The project is intentionally more than a CRUD file-storage application.
Its differentiating features are:

-   Secure cloud document storage
-   Automatic document classification
-   OCR/text extraction
-   Metadata extraction
-   Search
-   Expiry/reminder tracking
-   Document completeness/status dashboard
-   Role-based access
-   Audit trail
-   Optional AI-assisted semantic search/recommendations

------------------------------------------------------------------------

## 2. High-Level Architecture

``` text
                         ┌───────────────────────┐
                         │       Student         │
                         │   Web / Mobile UI     │
                         └───────────┬───────────┘
                                     │
                              HTTPS / API
                                     │
                         ┌───────────▼───────────┐
                         │      API Gateway      │
                         └───────────┬───────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
       │ Auth / User │       │ Document    │       │ Search /    │
       │ Lambda      │       │ Lambda      │       │ Query Lambda│
       └─────────────┘       └──────┬──────┘       └──────┬──────┘
                                    │                     │
                                    ▼                     ▼
                              ┌───────────┐        ┌─────────────┐
                              │    S3     │        │  DynamoDB   │
                              │ Documents │        │  Metadata   │
                              └─────┬─────┘        └─────────────┘
                                    │
                              Object Created
                                    │
                                    ▼
                         ┌────────────────────┐
                         │ Processing Lambda  │
                         └─────────┬──────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
         ┌────────────┐     ┌────────────┐    ┌─────────────┐
         │ OCR / Text │     │ Classifier │    │ Metadata /  │
         │ Extraction │     │            │    │ Date Parser │
         └────────────┘     └────────────┘    └─────────────┘
                │                  │                  │
                └──────────────────┼──────────────────┘
                                   ▼
                              ┌───────────┐
                              │ DynamoDB  │
                              │ Index     │
                              └─────┬─────┘
                                    │
                    ┌───────────────┼────────────────┐
                    ▼               ▼                ▼
              Search Results   Reminders       Dashboard
```

------------------------------------------------------------------------

## 3. AWS Service Mapping

  -----------------------------------------------------------------------
  Requirement             AWS service             Responsibility
  ----------------------- ----------------------- -----------------------
  File storage            Amazon S3               Store uploaded
                                                  documents

  Metadata database       Amazon DynamoDB         Store document records
                                                  and extracted metadata

  Backend APIs            AWS Lambda + API        Serverless application
                          Gateway                 logic

  Authentication          Amazon Cognito          Student/admin login and
                                                  identity

  Document processing     AWS Lambda              Triggered after upload

  OCR                     Amazon Textract         Extract text from
                                                  supported documents

  Classification          Lambda rules / optional Identify document
                          Amazon Bedrock          category and generate
                                                  insights

  Notifications           Amazon SNS / SES        Expiry and status
                                                  notifications

  Monitoring              Amazon CloudWatch       Logs, metrics and
                                                  troubleshooting

  Security                IAM + S3 policies       Least-privilege access

  Frontend                Static web app /        User interface
                          existing frontend stack 
  -----------------------------------------------------------------------

The implementation can start with Lambda rules for classification and
add an AI service only if the project schedule and AWS access permit it.

------------------------------------------------------------------------

## 4. Main Data Flow

### 4.1 Upload

``` text
Student
  ↓
Select file
  ↓
Frontend requests upload authorization
  ↓
API Gateway
  ↓
Lambda
  ↓
Pre-signed S3 upload URL
  ↓
Student uploads directly to S3
```

The application should avoid sending large files through Lambda
unnecessarily.

### 4.2 Processing

``` text
S3 ObjectCreated event
  ↓
Processing Lambda
  ↓
Validate file
  ↓
Extract text
  ↓
Detect document type
  ↓
Extract fields
  ↓
Calculate useful status
  ↓
Save metadata in DynamoDB
  ↓
Mark document = PROCESSED
```

### 4.3 Search

``` text
Student enters:
"Python certificates"

        ↓

API Gateway
        ↓
Search Lambda
        ↓
DynamoDB indexes / searchable metadata
        ↓
Matching documents
        ↓
Signed S3 download URLs
        ↓
Student
```

### 4.4 Reminder flow

``` text
Document has expiry date
        ↓
Scheduled check
        ↓
Expiry within configured threshold?
        ↓
YES
        ↓
Notification
        ↓
"Your certificate expires in 30 days."
```

------------------------------------------------------------------------

## 5. Suggested Components

### Frontend

Pages:

1.  Login
2.  Dashboard
3.  Upload document
4.  My documents
5.  Document details
6.  Search
7.  Expiring documents
8.  Profile/settings
9.  Admin dashboard

### Backend

Suggested Lambda functions:

-   `createUploadUrl`
-   `processDocument`
-   `getDocument`
-   `listDocuments`
-   `searchDocuments`
-   `deleteDocument`
-   `createReminder`
-   `sendExpiryNotifications`
-   `adminStats`

### Storage

S3 key convention:

``` text
documents/{userId}/{documentId}/original
documents/{userId}/{documentId}/preview
documents/{userId}/{documentId}/extracted.json
```

------------------------------------------------------------------------

## 6. DynamoDB Conceptual Model

### Document item

``` json
{
  "document_id": "DOC-001",
  "user_id": "USER-001",
  "file_name": "AWS_Certificate.pdf",
  "document_type": "CERTIFICATE",
  "title": "AWS Cloud Practitioner",
  "issuer": "Amazon Web Services",
  "issue_date": "2026-08-20",
  "expiry_date": null,
  "skills": ["AWS", "Cloud"],
  "s3_key": "documents/USER-001/DOC-001/original",
  "processing_status": "PROCESSED",
  "uploaded_at": "2026-10-06T10:00:00Z",
  "confidence": 0.94
}
```

Recommended access patterns:

-   All documents for a user
-   Document by ID
-   Documents by type
-   Documents nearing expiry
-   Search by extracted metadata
-   Recent uploads

------------------------------------------------------------------------

## 7. Security Architecture

### Authentication

Use Cognito for:

-   Sign up
-   Sign in
-   Password management
-   User identity

### Authorization

Users may access only their own documents.

Admins can access administrative statistics and authorized records.

### S3 security

-   Block public access
-   No public document URLs
-   Use short-lived pre-signed URLs
-   Store objects under user-specific prefixes

### IAM

Follow least privilege.

For example, the processing Lambda should receive only the S3 and
DynamoDB permissions it actually needs.

------------------------------------------------------------------------

## 8. Processing State Machine

Each document follows:

``` text
UPLOADED
   ↓
VALIDATING
   ↓
PROCESSING
   ↓
EXTRACTING
   ↓
CLASSIFYING
   ↓
INDEXING
   ↓
PROCESSED
```

Failure path:

``` text
Any stage
   ↓
PROCESSING_FAILED
   ↓
Error logged in CloudWatch
   ↓
User sees retry option
```

This makes failures visible instead of silently losing documents.

------------------------------------------------------------------------

## 9. Optional Advanced Layer

If the base system is complete, add semantic document assistance.

Example:

> "Show certificates related to cloud computing."

The system identifies documents using extracted skills/categories rather
than requiring the exact file name.

Another example:

> "Which of my documents expire soon?"

The system returns documents whose expiry dates are within the
configured threshold.

This feature can be implemented using metadata first. A vector/embedding
layer can be added later if required.

------------------------------------------------------------------------

## 10. Deployment Order

1.  Create S3 bucket.
2.  Create DynamoDB table.
3.  Create Cognito user pool.
4.  Create IAM roles.
5.  Create Lambda functions.
6.  Create API Gateway routes.
7.  Connect S3 event notifications.
8.  Implement document processing.
9.  Build frontend.
10. Connect frontend to API.
11. Add notifications.
12. Add monitoring.
13. Perform security testing.
14. Perform end-to-end demo testing.

------------------------------------------------------------------------

## 11. Demonstration Scenario

The strongest final demonstration should be:

``` text
1. Student logs in.
2. Student uploads an internship certificate.
3. File appears in S3.
4. S3 triggers processing.
5. System extracts text.
6. System identifies:
      Type: Internship Certificate
      Organization: ABC Technologies
      Date: 2026-07-15
7. Metadata is saved to DynamoDB.
8. Dashboard updates automatically.
9. Student searches "internship".
10. The certificate appears.
11. Student opens it through a secure URL.
12. Admin dashboard shows processing statistics.
```

This demonstrates the entire architecture rather than just a static
webpage.
