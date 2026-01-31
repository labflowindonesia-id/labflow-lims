# LabFlow PDF Worker

A Puppeteer-based PDF generation service for LabFlow LIMS.

## Features

- **Quotation PDF**: Professional quotation documents with line items and totals
- **Sample Receipt PDF**: Sample receiving confirmation documents
- **Certificate of Analysis (CoA)**: Lab reports with test results, signatures, and watermarks
- **Generic HTML-to-PDF**: Convert any HTML to PDF

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/pdf/quotation` | Generate quotation PDF |
| POST | `/api/pdf/sample-receipt` | Generate sample receipt PDF |
| POST | `/api/pdf/coa` | Generate CoA/Report PDF |
| POST | `/api/pdf/html` | Convert HTML to PDF |

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment to Fly.io

### Prerequisites

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/)
2. Login: `flyctl auth login`

### Deploy

```bash
# First time - create the app
flyctl launch

# Set API key secret
flyctl secrets set PDF_WORKER_API_KEY=your-secret-key

# Deploy
flyctl deploy
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `PDF_WORKER_API_KEY` | API key for authentication | `dev-key` |
| `PUPPETEER_EXECUTABLE_PATH` | Path to Chromium (set in Docker) | - |

## API Authentication

All endpoints (except `/health`) require the `x-api-key` header:

```bash
curl -X POST https://your-app.fly.dev/api/pdf/quotation \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '{ ... }'
```

## Watermark Support

CoA PDFs support watermarks. Pass the `watermark` field:

```json
{
  "reportNumber": "RPT-2026-001",
  "watermark": "DRAFT",
  "isDraft": true,
  ...
}
```

Common watermarks: `DRAFT`, `COPY`, `CONFIDENTIAL`, `VOID`
