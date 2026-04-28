# GST E-Invoice Guardian

GST E-Invoice Guardian is a small full-stack app for uploading invoice files, processing them, and showing basic GST invoice risk signals in a dashboard.

The project includes:

- a `FastAPI` backend
- a `Next.js` frontend
- CSV and PDF upload support
- local-friendly defaults using SQLite
- optional Redis/Celery support for queued processing

## Features

- Upload `.csv` or `.pdf` invoice files
- Process invoices into a batch
- Flag simple issues such as:
  - duplicate IRNs
  - invalid GSTINs
  - elevated mock anomaly scores
- View uploaded invoices in a dashboard
- Inspect lightweight XAI cue explanations per invoice

## Tech Stack

### Backend

- FastAPI
- SQLAlchemy
- Pandas
- PDFPlumber
- Celery
- Redis
- SQLite by default

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## Project Structure

```text
CODESPIRIT/
├── app/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── routers/
│   ├── tasks/
│   └── utils/
├── frontend/
│   ├── src/
│   └── package.json
├── init_db.py
├── requirements.txt
├── sample_compatible_upload.csv
├── large_compatible_upload.csv
└── README.md
```

## Local Setup

### 1. Backend

Create and activate a virtual environment, then install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the backend:

```bash
.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Notes:

- The backend now defaults to `sqlite:///./gst_guardian.db`
- Tables are created automatically on startup
- Redis is optional for local development
- If Redis is unavailable, uploads fall back to direct in-process handling

### 2. Frontend

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the frontend:

```bash
npm run dev
```

The frontend is expected at:

- `http://127.0.0.1:3000`

The backend API base defaults to:

- `http://127.0.0.1:8000`

## Optional Environment Variables

You can override defaults with a `.env` file in the project root:

```env
DATABASE_URL=sqlite:///./gst_guardian.db
REDIS_URL=redis://localhost:6379/0
```

For the frontend, you can set:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## API Endpoints

### Health

`GET /health`

Example response:

```json
{
  "status": "ok",
  "redis": "unavailable"
}
```

### Upload invoices

`POST /api/v1/invoices/bulk-upload`

Accepts:

- `.csv`
- `.pdf`

Returns:

```json
{
  "batch_id": "uuid",
  "status": "COMPLETED"
}
```

### Batch status

`GET /api/v1/batches/{batch_id}`

### List invoices

`GET /api/v1/invoices`

Optional query param:

- `batch_id`

## CSV Format

The cleanest compatible CSV format is:

```csv
irn,vendor_gstin,invoice_date,taxable_value
INV-000001,27AAPFU0939F1Z5,2026-04-10,50000
```

The parser is also tolerant of common alternate column names such as:

- `Invoice_ID`
- `Date`
- `GSTIN_Supplier`
- `Total_Amount`

## Sample Files

Two ready-to-use CSVs are included:

- [sample_compatible_upload.csv](/Users/shreejesh2006/Developer/CODESPIRIT/sample_compatible_upload.csv)
- [large_compatible_upload.csv](/Users/shreejesh2006/Developer/CODESPIRIT/large_compatible_upload.csv)

`large_compatible_upload.csv` contains 10,000 rows for heavier upload testing.

## Current Local Behavior

- If Redis is up, the app can queue processing through Celery
- If Redis is down, the backend processes uploads directly
- The dashboard reads invoices from the backend and maps API `snake_case` fields into frontend `camelCase` fields

## Troubleshooting

### Upload fails with a network error

Check that:

- the backend is running on `127.0.0.1:8000`
- the frontend is running on `127.0.0.1:3000`
- you restarted both after code changes

### Upload hangs

The app should now skip Celery when Redis is unavailable. If it still hangs, restart the backend and try again.

### No invoices appear

Check:

- backend logs
- `GET /api/v1/invoices`
- that the uploaded file uses a compatible schema

## Future Improvements

- stronger real fraud scoring instead of mock anomaly scoring
- better PDF extraction
- export functionality
- pagination and filtering for large datasets
- automated tests for upload and ingestion flows
