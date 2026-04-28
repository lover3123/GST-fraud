# GST E-Invoice Guardian — Official Technical Documentation

> **Project:** GST E-Invoice Guardian
> **Current Version:** `v1.0.0` — *Initial Production-Ready Release*
> **Last Updated:** 2026-04-29
> **Repository:** `lover3123/GST-fraud`
> **Status:** 🟢 Active Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Version History](#2-version-history)
3. [v1.0.0 — Current Version (Detailed)](#3-v100--current-version-detailed)
   - [Architecture](#31-architecture)
   - [Tech Stack](#32-tech-stack)
   - [Project Structure](#33-project-structure)
   - [Backend Modules](#34-backend-modules)
   - [Frontend Components](#35-frontend-components)
   - [Database Schema](#36-database-schema)
   - [API Reference](#37-api-reference)
   - [Data Flow](#38-data-flow)
   - [Fraud Detection Logic](#39-fraud-detection-logic)
4. [Progress Tracker](#4-progress-tracker)
5. [Known Limitations in v1.0.0](#5-known-limitations-in-v100)
6. [Roadmap — Upcoming Versions](#6-roadmap--upcoming-versions)
7. [Setup & Running Locally](#7-setup--running-locally)
8. [Environment Configuration](#8-environment-configuration)

---

## 1. Project Overview

**GST E-Invoice Guardian** is a full-stack fraud detection and risk analysis platform designed for GST (Goods and Services Tax) e-invoices in India. It enables auditors and finance teams to upload bulk invoice files (CSV or PDF), automatically process them through a rule-based and mock-ML pipeline, and visualize per-invoice risk signals on an interactive dashboard.

### Core Purpose

| Goal | Description |
|---|---|
| **Upload** | Accept bulk `.csv` or `.pdf` invoice files |
| **Process** | Parse, normalize, and validate invoice records |
| **Flag** | Detect anomalies using rule checks + ML scoring |
| **Visualize** | Display risk-ranked invoices with XAI cues |

---

## 2. Version History

| Version | Date | Status | Summary |
|---|---|---|---|
| `v0.1.0` | Pre-release | ✅ Shipped | Project scaffolding, FastAPI skeleton, basic SQLite DB setup |
| `v0.2.0` | Pre-release | ✅ Shipped | CSV upload pipeline, Pandas parsing, batch model |
| `v0.3.0` | Pre-release | ✅ Shipped | GSTIN validation rule, duplicate IRN detection |
| `v0.4.0` | Pre-release | ✅ Shipped | Mock anomaly scoring, `ai_explanation` JSON field |
| `v0.5.0` | Pre-release | ✅ Shipped | PDF upload support via pdfplumber |
| `v0.6.0` | Pre-release | ✅ Shipped | Redis/Celery async queue with sync fallback |
| `v0.7.0` | Pre-release | ✅ Shipped | Next.js 14 frontend scaffolded, Tailwind CSS design system |
| `v0.8.0` | Pre-release | ✅ Shipped | `UploadWidget` component with drag-and-drop |
| `v0.9.0` | Pre-release | ✅ Shipped | `Dashboard` invoice table, `RiskBadge`, `XaiTooltip` |
| **`v1.0.0`** | **2026-04-29** | **🟢 Current** | **Full end-to-end system, stable REST API, local-first defaults** |
| `v1.1.0` | Planned | 🔵 Planned | Real ML scoring (IsolationForest), pagination, export to CSV |
| `v2.0.0` | Planned | 🔵 Planned | Authentication, multi-tenant clients, GSTIN external verification |
| `v3.0.0` | Planned | 🔵 Planned | Real-time streaming, Kafka integration, advanced XAI with SHAP |

---

## 3. v1.0.0 — Current Version (Detailed)

### 3.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER (Port 3000)                    │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────────┐  │
│  │UploadWidget │   │  Dashboard  │   │XaiTooltip/Badge  │  │
│  └──────┬──────┘   └──────┬──────┘   └──────────────────┘  │
└─────────┼─────────────────┼───────────────────────────────-─┘
          │ HTTP POST        │ HTTP GET
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│               FASTAPI BACKEND (Port 8000)                   │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ POST /bulk-  │   │ GET /invoices│   │ GET /health    │  │
│  │  upload      │   │              │   │                │  │
│  └──────┬───────┘   └──────┬───────┘   └────────────────┘  │
│         │                  │                                 │
│  ┌──────▼──────────────────▼──────────────────────────────┐ │
│  │              Ingestion Pipeline (tasks/ingestion.py)   │ │
│  │  CSV Parser → Normalize → Rule Check → ML Score → DB  │ │
│  └────────────────────────────┬───────────────────────────┘ │
│         ┌──────────────┐      │                              │
│         │  Redis/Celery│◄─────┘  (optional async queue)     │
│         └──────────────┘                                     │
└────────────────────────────────────────┬────────────────────┘
                                         │ SQLAlchemy ORM
                                         ▼
                               ┌──────────────────┐
                               │   SQLite DB       │
                               │  (gst_guardian.db)│
                               │  invoices         │
                               │  batches          │
                               │  vendors          │
                               │  clients          │
                               └──────────────────┘
```

### 3.2 Tech Stack

#### Backend

| Package | Version | Role |
|---|---|---|
| `fastapi` | 0.115.0 | REST API framework |
| `uvicorn` | 0.30.6 | ASGI web server |
| `SQLAlchemy` | 2.0.34 | ORM & database abstraction |
| `pydantic-settings` | 2.4.0 | Environment config management |
| `celery` | 5.4.0 | Asynchronous task queue |
| `redis` | 5.0.8 | Message broker for Celery |
| `pandas` | 2.2.3 | CSV parsing & data normalization |
| `pdfplumber` | 0.11.4 | PDF text extraction |
| `psycopg2-binary` | 2.9.9 | PostgreSQL driver (optional) |

#### Frontend

| Package | Version | Role |
|---|---|---|
| `next` | 14.2.5 | React SSR framework |
| `react` | 18.3.1 | UI rendering library |
| `typescript` | 5.5.4 | Type-safe JavaScript |
| `tailwindcss` | 3.4.12 | Utility-first CSS framework |
| `@phosphor-icons/react` | 2.1.7 | Icon library |
| `clsx` | 2.1.1 | Conditional class utility |

---

### 3.3 Project Structure

```
GST-fraud/
├── app/                          # FastAPI backend
│   ├── __init__.py
│   ├── main.py                   # App factory, CORS, startup hooks
│   ├── core/
│   │   ├── config.py             # Pydantic settings (DATABASE_URL, REDIS_URL)
│   │   ├── celery_app.py         # Celery instance configuration
│   │   └── redis.py              # Redis client factory
│   ├── db/
│   │   ├── base.py               # SQLAlchemy declarative base
│   │   ├── deps.py               # DB session dependency injection
│   │   └── session.py            # Engine & SessionLocal factory
│   ├── models/
│   │   ├── __init__.py           # Model imports (ensures table registration)
│   │   ├── enums.py              # InvoiceStatus enum (PENDING/CLEAN/FLAGGED)
│   │   ├── invoice.py            # Invoice ORM model
│   │   ├── batch.py              # Batch ORM model
│   │   ├── vendor.py             # Vendor ORM model
│   │   ├── client.py             # Client ORM model
│   │   └── user.py               # User ORM model (stub)
│   ├── routers/
│   │   ├── health.py             # GET /health endpoint
│   │   └── invoices.py           # Upload, batch status, list endpoints
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── ingestion.py          # Core batch processing pipeline
│   │   └── sample.py             # Sample task placeholder
│   └── utils/
│       ├── __init__.py
│       ├── rules.py              # GSTIN validation, duplicate IRN detection
│       └── ml.py                 # Mock anomaly scoring (random, v1.0)
│
├── frontend/                     # Next.js 14 frontend
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── globals.css       # Global styles & design tokens
│       │   ├── layout.tsx        # Root layout (fonts, metadata)
│       │   └── page.tsx          # Entry page → renders Dashboard
│       ├── components/
│       │   ├── Dashboard.tsx     # Invoice table with live fetch
│       │   ├── UploadWidget.tsx  # Drag-and-drop file uploader
│       │   ├── RiskBadge.tsx     # Color-coded risk percentage badge
│       │   ├── XaiTooltip.tsx    # Hover tooltip for AI explanation cues
│       │   └── MismatchView.tsx  # Mismatch visualization (stub)
│       └── lib/
│           └── api.ts            # Typed API client (fetch wrappers)
│
├── init_db.py                    # Manual DB initialization script
├── requirements.txt              # Python dependencies
├── sample_compatible_upload.csv  # Small test file (few rows)
├── large_compatible_upload.csv   # Large test file (10,000 rows)
└── README.md
```

---

### 3.4 Backend Modules

#### `app/main.py` — Application Factory
- Creates a `FastAPI` instance with the project name from settings
- Registers CORS middleware permitting localhost origins on ports 3000, 3001, and 8000
- Includes `health_router` and `invoices_router` (prefixed `/api/v1`)
- Runs `Base.metadata.create_all()` on startup to auto-create all DB tables

#### `app/core/config.py` — Configuration
- Uses `pydantic-settings` with `.env` file support
- **Defaults:** `DATABASE_URL = sqlite:///./gst_guardian.db`, `REDIS_URL = redis://localhost:6379/0`
- Override via `.env` or environment variables for production

#### `app/core/redis.py` — Redis Client
- Returns a Redis client pointed at `settings.REDIS_URL`
- Used by `invoices.py` to check queue availability before dispatching Celery tasks

#### `app/tasks/ingestion.py` — Batch Processing Pipeline
The central processing unit. Triggered synchronously (local) or via Celery (Redis available).

**Steps:**
1. Fetch `Batch` record from DB; mark as in-progress
2. For each file: dispatch to `_parse_csv()` or `_parse_pdf()`
3. Collect all records, extract IRNs and vendor GSTINs
4. Run `find_duplicate_irns()` → flag intra-batch duplicates
5. Query DB for existing IRNs → flag cross-batch duplicates
6. Upsert vendor records (new GSTINs added with placeholder name)
7. Per record: evaluate rules → run `mock_anomaly_score()` → determine status
8. Insert `Invoice` rows; mark `Batch` as `COMPLETED` or `FAILED`

#### `app/utils/rules.py` — Deterministic Rule Engine

| Rule | Logic |
|---|---|
| **Duplicate IRN** | IRN already seen within batch or existing in DB |
| **Invalid GSTIN** | Does not match `^[0-9A-Z]{15}$` regex pattern |

#### `app/utils/ml.py` — Mock Anomaly Scorer *(v1.0 placeholder)*
- Returns a `random.uniform(0.0, 1.0)` risk score
- Returns an explanation dict with `amount_round_figure` and `new_vendor` mock weights
- **Note:** This will be replaced with a real ML model in v1.1.0

---

### 3.5 Frontend Components

#### `Dashboard.tsx`
- Fetches `/api/v1/invoices` on mount via `fetchInvoices()`
- Renders a scrollable table: IRN, Vendor GSTIN, Invoice Date, Taxable Value, Risk
- Accepts `onUploadComplete` callback from `UploadWidget` to trigger a data refresh

#### `UploadWidget.tsx`
- Supports **drag-and-drop** and **click-to-browse** file selection
- Accepts `.csv` and `.pdf` files only (validated by extension + MIME type)
- Upload states: `idle → uploading → processing → completed → error`
- Polls `GET /api/v1/batches/{batch_id}` every 2 seconds while `processing`
- Resets to idle automatically after 2 seconds of `completed` state

#### `RiskBadge.tsx`
- Displays risk as a color-coded percentage badge

| Score Range | Color | Label Example |
|---|---|---|
| 0.00 – 0.33 | 🟢 Emerald | `12% risk` |
| 0.34 – 0.66 | 🟡 Amber | `51% risk` |
| 0.67 – 1.00 | 🔴 Red | `84% risk` |

#### `XaiTooltip.tsx`
- Hover-activated tooltip showing per-invoice AI explanation entries
- Maps backend keys to human-readable cues:

| Backend Key | Display Text |
|---|---|
| `amount_round_figure` | Transaction amount is unusually round |
| `new_vendor` | Vendor appears newly introduced |
| `rules` | Deterministic validation rule triggered |

#### `MismatchView.tsx`
- Stub component for displaying field-level mismatches between invoice versions *(not yet wired)*

---

### 3.6 Database Schema

#### `batches` table
| Column | Type | Notes |
|---|---|---|
| `id` | `VARCHAR(36)` | Primary key (UUID) |
| `status` | `VARCHAR(20)` | `PENDING / COMPLETED / FAILED` |
| `created_at` | `DATETIME` | Set on creation |
| `completed_at` | `DATETIME` | Set when processing ends |

#### `vendors` table
| Column | Type | Notes |
|---|---|---|
| `gstin` | `VARCHAR` | Primary key |
| `legal_name` | `VARCHAR` | `"Unknown"` for auto-inserted |
| `aggregated_risk_score` | `FLOAT` | Defaults to `0.0` |

#### `invoices` table
| Column | Type | Notes |
|---|---|---|
| `irn` | `VARCHAR(64)` | Primary key (Invoice Reference Number) |
| `client_id` | `INT` (FK) | References `clients.id` (nullable) |
| `vendor_gstin` | `VARCHAR` (FK) | References `vendors.gstin` |
| `batch_id` | `VARCHAR(36)` (FK) | References `batches.id` |
| `invoice_date` | `DATE` | Parsed from upload |
| `taxable_value` | `FLOAT` | Invoice amount in INR |
| `risk_score` | `FLOAT` | 0.0 – 1.0 |
| `ai_explanation` | `JSON` | Key-value explanation map |
| `status` | `VARCHAR(20)` | `PENDING / CLEAN / FLAGGED` |

#### `clients` table
- Stub model; stores client entities linked to invoices (not yet exposed via API)

#### `users` table
- Stub model; reserved for future authentication system

---

### 3.7 API Reference

#### `GET /health`
Check backend and Redis availability.

**Response:**
```json
{ "status": "ok", "redis": "unavailable" }
```

---

#### `POST /api/v1/invoices/bulk-upload`
Upload one or more invoice files for processing.

- **Content-Type:** `multipart/form-data`
- **Accepted formats:** `.csv`, `.pdf`

**Success Response (202):**
```json
{ "batch_id": "550e8400-e29b-41d4-a716-446655440000", "status": "COMPLETED" }
```

**Error Response (400):**
```json
{ "detail": "Unsupported file type: .xlsx" }
```

---

#### `GET /api/v1/batches/{batch_id}`
Retrieve status and invoice count for a batch.

**Response:**
```json
{
  "batch_id": "550e8400-...",
  "status": "COMPLETED",
  "created_at": "2026-04-29T01:00:00",
  "completed_at": "2026-04-29T01:00:05",
  "invoice_count": 1000
}
```

---

#### `GET /api/v1/invoices`
List all processed invoices, optionally filtered by batch.

**Query Params:** `?batch_id=<uuid>` *(optional)*

**Response:**
```json
{
  "items": [
    {
      "irn": "INV-000001",
      "vendor_gstin": "27AAPFU0939F1Z5",
      "invoice_date": "2026-04-10",
      "taxable_value": 50000.0,
      "risk_score": 0.8312,
      "ai_explanation": { "amount_round_figure": 0.3, "new_vendor": 0.25 },
      "status": "FLAGGED",
      "batch_id": "550e8400-..."
    }
  ]
}
```

---

### 3.8 Data Flow

```
User drops CSV file
       │
       ▼
UploadWidget (frontend)
       │  POST multipart/form-data
       ▼
POST /api/v1/invoices/bulk-upload
       │
       ├─ Save file to temp dir
       ├─ Create Batch(status=PENDING) in DB
       │
       ├─ Redis available? ──Yes──► Celery task (async)
       │                   │
       │                   No
       │                   ▼
       └──────────── process_batch() (sync)
                          │
                          ├─ _parse_csv() via pandas
                          │    └─ Tolerant column name mapping
                          │
                          ├─ find_duplicate_irns()
                          ├─ Query existing IRNs from DB
                          ├─ Upsert Vendor records
                          │
                          └─ Per invoice:
                               ├─ is_valid_gstin() → rule flag
                               ├─ duplicate_irn check → rule flag
                               ├─ mock_anomaly_score() → score + explanation
                               ├─ status = FLAGGED if rules or score >= 0.7
                               └─ INSERT Invoice row
                                        │
                                        ▼
                              Batch.status = COMPLETED
                                        │
                              Frontend polls GET /batches/{id}
                                        │
                              Dashboard refreshes invoice list
```

---

### 3.9 Fraud Detection Logic

**Flagging Criteria (v1.0.0):**

| Check | Type | Trigger Condition |
|---|---|---|
| Duplicate IRN | Rule-based | IRN appears more than once in batch OR already exists in DB |
| Invalid GSTIN | Rule-based | Vendor GSTIN does not match `^[0-9A-Z]{15}$` |
| High Anomaly Score | Mock-ML | Random score ≥ 0.70 |

**Status Assignment:**
- `CLEAN` — No rule flags AND score < 0.70
- `FLAGGED` — Any rule flag OR score ≥ 0.70
- `PENDING` — Default before processing (should not persist after pipeline)

**CSV Column Tolerance:**
The parser accepts multiple column name variants:

| Field | Accepted Column Names |
|---|---|
| IRN | `irn`, `IRN`, `invoice_id`, `Invoice_ID`, `invoice_number` |
| GSTIN | `vendor_gstin`, `Vendor_GSTIN`, `GSTIN_Supplier`, `supplier_gstin` |
| Date | `invoice_date`, `Invoice_Date`, `date`, `Date` |
| Amount | `taxable_value`, `Total_Amount`, `invoice_amount`, `taxableAmount` |

---

## 4. Progress Tracker

### Backend Progress

| Module | Feature | Status |
|---|---|---|
| App Factory | FastAPI setup, CORS, startup hooks | ✅ Complete |
| Configuration | Pydantic settings, `.env` support | ✅ Complete |
| Health Endpoint | Redis availability check | ✅ Complete |
| Bulk Upload | Multipart file upload, temp file saving | ✅ Complete |
| Batch Management | Create, status query, completion tracking | ✅ Complete |
| Invoice Listing | List all / filter by batch | ✅ Complete |
| CSV Ingestion | Pandas parsing with tolerant column mapping | ✅ Complete |
| PDF Ingestion | pdfplumber open (stub record created) | ⚠️ Partial |
| Rule Engine | Duplicate IRN, Invalid GSTIN | ✅ Complete |
| ML Scoring | Mock random anomaly score | ⚠️ Mock only |
| XAI Explanation | JSON explanation stored per invoice | ✅ Complete |
| Async Queue | Celery + Redis with sync fallback | ✅ Complete |
| Vendor Tracking | Auto-insert unknown vendors | ✅ Complete |
| Authentication | JWT / user auth | ❌ Not started |
| Pagination | Limit/offset for large datasets | ❌ Not started |
| Export | CSV/Excel export of flagged invoices | ❌ Not started |
| Real ML Model | IsolationForest / XGBoost scoring | ❌ Not started |

### Frontend Progress

| Component | Feature | Status |
|---|---|---|
| UploadWidget | Drag-and-drop, file type validation | ✅ Complete |
| UploadWidget | Upload state machine (idle→processing→done) | ✅ Complete |
| UploadWidget | Batch polling with auto-reset | ✅ Complete |
| Dashboard | Invoice table with live API binding | ✅ Complete |
| RiskBadge | Color-coded risk percentage | ✅ Complete |
| XaiTooltip | Hover explanation tooltip | ✅ Complete |
| MismatchView | Field mismatch visualization | ⚠️ Stub only |
| Export Button | Download invoices as CSV | ❌ Not wired |
| Pagination | Page controls for large datasets | ❌ Not started |
| Filtering | Filter by status, date, vendor | ❌ Not started |
| Authentication | Login page, protected routes | ❌ Not started |

---

## 5. Known Limitations in v1.0.0

> [!WARNING]
> The following are active limitations that will be addressed in upcoming versions.

| # | Limitation | Impact | Target Version |
|---|---|---|---|
| 1 | **Mock ML scoring** — `ml.py` uses `random.uniform()`, not a trained model | Risk scores are meaningless in production | v1.1.0 |
| 2 | **PDF parsing is a stub** — only opens PDF, creates a placeholder record | PDFs yield no real invoice data | v1.1.0 |
| 3 | **No pagination** — `GET /invoices` returns all rows with no limit | Slow with large datasets; memory pressure | v1.1.0 |
| 4 | **No authentication** — API is fully open | Unsuitable for multi-user or production deployment | v2.0.0 |
| 5 | **No export** — Export button in Dashboard is UI-only, not wired | Users cannot download results | v1.1.0 |
| 6 | **MismatchView stub** — Component exists but renders nothing meaningful | Feature not usable | v1.2.0 |
| 7 | **SQLite default** — Not suitable for concurrent production workloads | Data integrity under concurrency risk | v2.0.0 |
| 8 | **GSTIN validation is regex-only** — No external GSTN portal verification | Invalid-but-matching GSTINs pass | v2.0.0 |
| 9 | **No automated tests** — No unit or integration tests exist | Regressions hard to catch | v1.1.0 |
| 10 | **Temp files not cleaned up** — Uploaded files persist in OS temp dir | Disk usage grows over time | v1.1.0 |

---

## 6. Roadmap — Upcoming Versions

### v1.1.0 — Intelligence & Stability
**Target:** ~4–6 weeks

- [ ] Replace `mock_anomaly_score()` with `scikit-learn` `IsolationForest` trained on synthetic GST data
- [ ] Real PDF table extraction using `pdfplumber` table detection
- [ ] Pagination: `limit` / `offset` query params on `GET /invoices`
- [ ] Filter invoices by `status`, `date_range`, `vendor_gstin`
- [ ] Wire Export button → `GET /api/v1/invoices/export` returning CSV
- [ ] Temp file cleanup after batch processing
- [ ] Unit tests for rules engine and ingestion pipeline (`pytest`)
- [ ] Integration tests for upload + fetch flow

### v1.2.0 — UX Enhancement
**Target:** ~8–10 weeks

- [ ] `MismatchView` — side-by-side comparison for invoices with duplicate IRNs
- [ ] Batch history page — list all past uploads with status and counts
- [ ] Invoice detail page — full record with all flags and explanation breakdown
- [ ] Toast notifications replacing polling UX
- [ ] Mobile-responsive layout pass

### v2.0.0 — Production-Grade Platform
**Target:** ~3–4 months

- [ ] JWT-based authentication (login, token refresh, protected routes)
- [ ] Multi-tenant client isolation — each client sees only their batches
- [ ] PostgreSQL as the primary database (SQLite remains for local dev)
- [ ] GSTIN external verification via GSTN sandbox API
- [ ] Role-based access control (Admin, Auditor, Viewer)
- [ ] Audit log — track all user actions and batch events
- [ ] Rate limiting on upload endpoint

### v3.0.0 — Advanced Analytics & Streaming
**Target:** ~6+ months

- [ ] SHAP-based XAI — real feature importance values instead of mock weights
- [ ] Vendor risk aggregation — cross-batch vendor-level risk profiles
- [ ] Network graph visualization — supplier-buyer transaction graphs
- [ ] Kafka integration for real-time invoice streaming
- [ ] Alerting system — email/webhook notifications for high-risk batches
- [ ] Admin dashboard with system-wide statistics

---

## 7. Setup & Running Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- Redis *(optional — system works without it)*

### Backend

```bash
# 1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> Tables are created automatically on first startup. No manual migration needed.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend accessible at: **http://127.0.0.1:3000**
Backend API accessible at: **http://127.0.0.1:8000**
Interactive API docs: **http://127.0.0.1:8000/docs**

---

## 8. Environment Configuration

### Backend `.env` (project root)

```env
DATABASE_URL=sqlite:///./gst_guardian.db
REDIS_URL=redis://localhost:6379/0
```

For PostgreSQL (production):
```env
DATABASE_URL=postgresql://user:password@host:5432/gst_guardian
```

### Frontend `.env.local` (`frontend/` directory)

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

---

### CSV Upload Format

**Canonical format:**
```csv
irn,vendor_gstin,invoice_date,taxable_value
INV-000001,27AAPFU0939F1Z5,2026-04-10,50000
```

**Alternate accepted column names** are handled automatically by the tolerant parser. Refer to §3.9 for the full column alias table.

---

*Documentation maintained as part of the GST E-Invoice Guardian project. For issues or contributions, refer to the project repository.*
