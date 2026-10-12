# DocuVault — Smart College Document Assistant

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff)](https://vitejs.dev/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900)](https://aws.amazon.com/)

> A secure cloud platform that automatically stores, understands, organizes, searches, and monitors student academic documents.

---

## Overview

DocuVault is a full-stack serverless web application that enables college students to:

- **Upload** academic documents (PDFs, images) securely to AWS S3
- **Auto-classify** documents into categories (Certificate, Mark Sheet, Internship, Resume, etc.)
- **Extract metadata** using Amazon Textract OCR (issuer, dates, skills, keywords)
- **Search** documents by content, keywords, and category
- **Monitor expiry dates** with automated notifications
- **Dashboard** with analytics and processing status

---

## Quick Start (Demo Mode — No AWS Required)

```bash
# 1. Clone/navigate to the project
cd cloud/frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

Demo mode is enabled by default. Use the **"Demo Student"** or **"Demo Admin"** buttons on the login page.

---

## Project Structure

```
cloud/
├── frontend/                  # React + TypeScript (Vite)
│   ├── src/
│   │   ├── api/client.ts      # API client (demo/AWS mode switch)
│   │   ├── contexts/          # Auth context
│   │   ├── demo/demoStore.ts  # Demo data store
│   │   ├── pages/             # All 9 pages
│   │   ├── components/        # Shared components (Sidebar, AppLayout)
│   │   └── utils/docUtils.ts  # Document helpers
│   ├── .env                   # VITE_DEMO_MODE=true (default)
│   └── .env.example           # Template for AWS configuration
│
├── backend/                   # AWS Lambda functions (Node.js)
│   ├── lambda/
│   │   ├── createUploadUrl/   # POST /documents/upload-url
│   │   ├── processDocument/   # S3 trigger → OCR → classify
│   │   ├── listDocuments/     # GET /documents
│   │   ├── getDocument/       # GET /documents/:id
│   │   ├── deleteDocument/    # DELETE /documents/:id
│   │   ├── searchDocuments/   # GET /documents/search
│   │   ├── adminStats/        # GET /admin/statistics
│   │   └── sendExpiryNotifications/  # Scheduled (EventBridge)
│   ├── shared/
│   │   ├── classifier.js      # Keyword-based document classifier
│   │   ├── dynamodb.js        # DynamoDB helper functions
│   │   └── utils.js           # Shared utilities
│   └── __tests__/             # Unit tests
│
└── infrastructure/
    └── cloudformation.yml     # Complete AWS CloudFormation template
```

---

## Application Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Sign in / demo quick login |
| Dashboard | `/dashboard` | Stats, charts, recent documents |
| Upload | `/upload` | Drag & drop file upload |
| My Documents | `/documents` | List with search & filters |
| Document Details | `/documents/:id` | Full metadata, confidence, expiry |
| Search | `/search` | Full-text search with filters |
| Expiring | `/expiring` | Documents by expiry urgency |
| Profile | `/profile` | Settings, mode status |
| Admin | `/admin` | System-wide statistics (admin only) |

---

## Environment Variables

### Frontend (`frontend/.env`)

```env
# Enable local demo mode (no AWS needed)
VITE_DEMO_MODE=true

# AWS API Gateway URL (required in production)
VITE_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod

# AWS Cognito (required in production)
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_COGNITO_REGION=us-east-1
```

### Backend Lambda Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DYNAMODB_TABLE` | DynamoDB table name | `DocuVaultDocuments` |
| `S3_BUCKET` | S3 bucket name | `docuvault-private-documents` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `USE_TEXTRACT` | Enable Textract OCR | `true` |
| `MAX_FILE_SIZE_MB` | Max upload size | `20` |
| `CORS_ORIGIN` | CORS origin | `*` |
| `SNS_TOPIC_ARN` | SNS topic for notifications | (optional) |
| `EXPIRY_THRESHOLD_DAYS` | Days before expiry to notify | `30` |

---

## Demo Mode vs Production

| Feature | Demo Mode | Production (AWS) |
|---------|-----------|-----------------|
| Authentication | Local session | Amazon Cognito |
| File Storage | Browser memory | Amazon S3 (private) |
| Document Metadata | In-memory store | Amazon DynamoDB |
| OCR / Text Extraction | Filename-based fallback | Amazon Textract |
| Notifications | Console log only | Amazon SNS/SES |
| Search | Client-side filter | Lambda + DynamoDB |
| Download URLs | Not available | S3 Pre-signed URLs |
| Admin Stats | Sample data | Real DynamoDB scan |

Switch between modes by setting `VITE_DEMO_MODE=true/false` in `frontend/.env`.

---

## Document Categories

| Category | Keywords Used |
|----------|--------------|
| Certificate | certificate, certified, awarded, achievement |
| Mark Sheet | marks, semester, CGPA, grade, result |
| Internship | internship, intern, training, trainee |
| Resume | resume, curriculum vitae, work experience, skills |
| ID Document | aadhaar, pan, passport, voter id, identity card |
| Course Completion | coursera, udemy, nptel, course completion, mooc |
| Achievement | winner, prize, champion, merit, scholarship |
| Recommendation Letter | recommendation, reference letter, to whom it may concern |
| Other | Fallback for low-confidence classification |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/documents/upload-url` | Get pre-signed S3 upload URL |
| GET | `/documents` | List all user documents |
| GET | `/documents/:id` | Get document + download URL |
| DELETE | `/documents/:id` | Delete document |
| GET | `/documents/search` | Search with filters |
| GET | `/admin/statistics` | Admin aggregate stats |

---

## Scripts

```bash
# Frontend
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
cd backend
npm install          # Install dependencies
npm test             # Run unit tests
npm run test:coverage # Run tests with coverage
```

---

## Security Design

- ✅ Private S3 bucket (public access blocked)
- ✅ Pre-signed URLs for all uploads/downloads (expire in 5 min / 1 hour)
- ✅ JWT authentication via Cognito on all Lambda endpoints
- ✅ User-scoped DynamoDB queries (users can only see their own docs)
- ✅ Admin role required for admin endpoints
- ✅ File type and size validation (server + client)
- ✅ Environment variables for all secrets (never in code)
- ✅ Least-privilege IAM roles for Lambda
- ✅ Deletion confirmation modal
- ✅ Audit log on delete events

---

## Architecture

```
Student → HTTPS → API Gateway → Lambda → S3 (upload)
                                       → DynamoDB (metadata)
S3 ObjectCreated → processDocument Lambda → Textract → Classifier → DynamoDB
```

See [`architecture.md`](./architecture.md) for the complete architecture documentation.

---

## License

Built as a college project demonstrating AWS serverless architecture.
