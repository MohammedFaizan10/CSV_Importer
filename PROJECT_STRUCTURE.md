# Project Structure

Complete overview of the GrowEasy CSV Importer codebase.

## 📁 Root Directory

```
groweasy-csv-importer/
├── backend/                 # Node.js/Express API server
├── frontend/                # Next.js React application
├── test-csvs/              # Sample CSV files for testing
├── docs/                   # Documentation and screenshots
├── .kiro/                  # Kiro AI workspace (specs, tasks)
├── docker-compose.yml      # Docker orchestration
├── DEPLOYMENT.md           # Deployment guide
├── PROJECT_STRUCTURE.md    # This file
└── README.md              # Main documentation
```

---

## 🔧 Backend Structure

```
backend/
├── src/
│   ├── index.ts                    # Express server entry point
│   ├── constants/
│   │   ├── config.ts              # Configuration (batch size, retry logic)
│   │   └── crm.ts                 # CRM field definitions
│   ├── routes/
│   │   └── import.ts              # POST /api/import endpoint
│   ├── services/
│   │   ├── aiExtractor.ts         # AI batch processing & prompts
│   │   ├── csvParser.ts           # CSV parsing with csv-parse
│   │   ├── validator.ts           # Validation & sanitization
│   │   └── __tests__/
│   │       ├── aiExtractor.test.ts
│   │       └── validator.test.ts
│   └── types/
│       ├── crm.ts                 # CRM type definitions
│       └── universal.ts           # Universal record types
├── dist/                          # Compiled JavaScript (gitignored)
├── node_modules/                  # Dependencies (gitignored)
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment template
├── Dockerfile                    # Docker build instructions
├── jest.config.js               # Jest test configuration
├── package.json                 # Dependencies & scripts
└── tsconfig.json               # TypeScript configuration
```

### Key Backend Files

#### **src/index.ts**
Express server initialization, middleware setup, CORS configuration.

#### **src/routes/import.ts**
- Handles `POST /api/import?mode=<crm|universal>`
- Multer file upload (10 MB limit)
- CSV parsing → AI extraction → Validation → Response

#### **src/services/aiExtractor.ts**
- **System Prompts**: SYSTEM_PROMPT (Universal), CRM_SYSTEM_PROMPT (CRM)
- **Batch Processing**: Chunks rows into 10-row batches
- **AI API Calls**: NVIDIA NIM with retry logic (6 attempts, exponential backoff)
- **Schema Detection**: Extracts columns, types, sample values from AI response

#### **src/services/csvParser.ts**
- Parses CSV buffer with `csv-parse`
- Validates structure (headers, rows)
- Returns headers + raw rows

#### **src/services/validator.ts**
- **CSV Injection Prevention**: Sanitizes `=`, `+`, `-`, `@` prefixes
- **Empty Row Detection**: Skips completely empty rows
- **CRM Mode**: Validates email/phone (warns if missing, still imports)
- **Universal Mode**: Schema completeness check

#### **src/constants/config.ts**
```typescript
export const BATCH_SIZE = 10;                    // Rows per batch
export const MAX_RETRY_ATTEMPTS = 6;             // API retry count
export const RETRY_DELAYS_MS = [1000, 2000, ...]; // Exponential backoff
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
```

---

## 🎨 Frontend Structure

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout, fonts, metadata
│   ├── page.tsx                   # Main page component (upload/results)
│   └── globals.css                # Global styles, animations, theme
├── components/
│   ├── FloatingBackground.tsx     # Animated background orbs
│   ├── PreviewTable.tsx           # CSV preview before import
│   ├── ResultsTable.tsx           # Imported records table
│   ├── SkippedTable.tsx           # Skipped records table
│   ├── SummaryBar.tsx             # Import summary stats
│   ├── ThemeToggle.tsx            # Dark/light mode toggle
│   └── UploadZone.tsx             # Drag & drop file upload
├── hooks/
│   └── useCSVImport.ts            # Custom hook for import logic
├── types/
│   ├── crm.ts                     # CRM type definitions
│   └── universal.ts               # Universal record types
├── public/                        # Static assets
├── .next/                         # Next.js build output (gitignored)
├── node_modules/                  # Dependencies (gitignored)
├── .env.local                    # Frontend environment (gitignored)
├── .env.local.example            # Environment template
├── Dockerfile                    # Docker build instructions
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies & scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.ts           # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

### Key Frontend Files

#### **app/page.tsx**
Main application component with:
- **Phase State**: upload → processing → results/failed
- **Mode Selector**: CRM Mode / Universal Mode toggle
- **Upload Zone**: Drag & drop + file browser
- **Preview**: First 100 rows before import
- **Processing**: Animated spinner with progress bar
- **Results**: Imported/Skipped tables with summary

#### **hooks/useCSVImport.ts**
Custom React hook managing:
- **File Upload State**: idle → dragging → file_selected → error
- **Phase Transitions**: upload → processing → results/failed
- **CSV Preview**: papaparse client-side parsing (first 100 rows)
- **API Integration**: POST to backend with mode parameter
- **Error Handling**: Network errors, validation errors

#### **components/UploadZone.tsx**
- Drag & drop functionality
- File validation (CSV only, 10 MB max)
- Upload state indicators (idle, dragging, file selected, error)
- File preview with remove option

#### **components/ResultsTable.tsx**
- Dynamic table rendering for any CSV structure
- Type-aware formatting:
  - Dates: Locale string (e.g., "May 13, 2026")
  - Booleans: ✓ / ✗
  - Currency: $29.99
  - Percentages: 12.5%
- Row numbers and metadata display

#### **app/globals.css**
- **CSS Custom Properties**: Theme colors, glassmorphism effects
- **Animations**: fade-in, fade-up, shimmer-text, pulse-glow, spin-custom
- **Utility Classes**: glass, glass-border, gradient-text, tabular
- **Responsive Design**: Mobile-first breakpoints

---

## 🧪 Test Files

```
backend/src/services/__tests__/
├── aiExtractor.test.ts        # AI JSON parsing, schema detection
└── validator.test.ts          # CSV injection, validation rules
```

```
test-csvs/
├── facebook.csv              # Facebook Lead Ads format
├── google_ads.csv            # Google Ads conversion format
├── broker.csv                # Real estate broker export
├── currency.csv              # Currency reference data
├── products.csv              # Product catalog
├── sales.csv                 # Sales transaction data
└── inventory.csv             # Inventory management data
```

---

## 🐳 Docker Configuration

### **docker-compose.yml**
- **backend service**: Ports 4000, NVIDIA_API_KEY env
- **frontend service**: Ports 3000, depends on backend
- **restart policy**: unless-stopped

### **backend/Dockerfile**
- Multi-stage build (build → production)
- Node 20 slim base image
- Compiles TypeScript → dist/
- Production: installs only prod dependencies

### **frontend/Dockerfile**
- Multi-stage build (build → production)
- Node 20 slim base image
- Next.js build optimized for production
- Serves with `next start`

---

## 📚 Documentation Files

```
DEPLOYMENT.md              # Comprehensive deployment guide
PROJECT_STRUCTURE.md       # This file - codebase overview
README.md                 # Main documentation with quickstart
docs/README.md            # Screenshot guidelines
.env.example              # Backend environment template
.env.local.example        # Frontend environment template
.env.production.example   # Production environment template
```

---

## 🔑 Key Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework with SSR | 14.2.5 |
| **TypeScript** | Type-safe JavaScript | 5.0+ |
| **Express** | Backend HTTP server | 4.19+ |
| **Multer** | File upload handling | 1.4+ |
| **csv-parse** | Backend CSV parsing | 5.5+ |
| **papaparse** | Frontend CSV parsing | 5.4+ |
| **OpenAI SDK** | NVIDIA NIM API client | 4.52+ |
| **Tailwind CSS** | Utility-first CSS | 3.4+ |
| **Jest** | Unit testing framework | 29.7+ |

---

## 🔄 Data Flow

```
1. User uploads CSV file
   └─→ frontend/components/UploadZone.tsx

2. Client-side preview (papaparse)
   └─→ frontend/hooks/useCSVImport.ts

3. User confirms, POST to backend
   └─→ backend/src/routes/import.ts

4. Parse CSV buffer
   └─→ backend/src/services/csvParser.ts

5. Batch & send to AI (sequential)
   └─→ backend/src/services/aiExtractor.ts
       ├─→ NVIDIA NIM API (openai/gpt-oss-120b)
       └─→ Retry logic on 429/failure

6. Validate & sanitize results
   └─→ backend/src/services/validator.ts

7. Return JSON response
   └─→ frontend displays results
       ├─→ components/SummaryBar.tsx
       ├─→ components/ResultsTable.tsx
       └─→ components/SkippedTable.tsx
```

---

## 🎯 Entry Points

- **Development Backend**: `npm run dev` → `ts-node src/index.ts` → Port 4000
- **Development Frontend**: `npm run dev` → `next dev` → Port 3000
- **Production Backend**: `npm run build` + `npm start` → `node dist/index.js`
- **Production Frontend**: `npm run build` + `npm start` → `next start`
- **Docker**: `docker-compose up` → Both services in containers

---

## 📦 Build Outputs

### Backend
- **Source**: `src/**/*.ts`
- **Compiled**: `dist/**/*.js`
- **Ignored**: `dist/`, `node_modules/`, `.env`

### Frontend
- **Source**: `app/**/*.tsx`, `components/**/*.tsx`
- **Build**: `.next/` (optimized production build)
- **Ignored**: `.next/`, `node_modules/`, `.env.local`, `tsconfig.tsbuildinfo`

---

## 🔐 Environment Variables

### Backend `.env`
```env
NVIDIA_API_KEY=nvapi-xxxxx           # Required: NVIDIA NIM API key
NVIDIA_MODEL=openai/gpt-oss-120b     # Optional: AI model selection
PORT=4000                            # Optional: Server port
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000   # Required: Backend URL
```

---

## 🚀 Scripts Reference

### Backend Scripts
```json
{
  "dev": "ts-node src/index.ts",           // Development server with ts-node
  "build": "tsc",                          // Compile TypeScript → dist/
  "start": "node dist/index.js",          // Production server
  "test": "jest",                         // Run unit tests
  "test:watch": "jest --watch"            // Watch mode for tests
}
```

### Frontend Scripts
```json
{
  "dev": "next dev",                      // Development server (hot reload)
  "build": "next build",                  // Production build
  "start": "next start",                  // Production server
  "lint": "next lint"                     // ESLint checks
}
```

---

## 📝 Type Definitions

### UniversalRecord (backend/src/types/universal.ts)
```typescript
export interface UniversalRecord {
  [key: string]: unknown;  // Dynamic fields from CSV
  _metadata: RecordMetadata;
}

export interface RecordMetadata {
  row_number: number;
  import_timestamp: string;  // ISO 8601
  field_types: Record<string, DataType>;
}
```

### CrmRecord (backend/src/types/crm.ts)
```typescript
export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus;
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
  _metadata: RecordMetadata;
}
```

---

## 🎨 UI Components Hierarchy

```
app/page.tsx (Main Page)
├── FloatingBackground
├── Header
│   ├── Logo + Title
│   └── ThemeToggle
└── Main Content (phase-based)
    ├── Upload Phase
    │   ├── Mode Selector (CRM/Universal)
    │   ├── UploadZone
    │   └── PreviewTable + Confirm Button
    ├── Processing Phase
    │   ├── Animated Spinner
    │   └── Progress Bar
    ├── Failed Phase
    │   └── Error Message + Retry Button
    └── Results Phase
        ├── SummaryBar
        ├── ResultsTable
        ├── SkippedTable
        └── Import Another Button
```

---

## 🔍 Search Reference

**Find by Feature:**
- Mode Selector: `frontend/app/page.tsx` (line ~115)
- AI Prompts: `backend/src/services/aiExtractor.ts` (lines 26-237)
- CSV Parsing: `backend/src/services/csvParser.ts`
- Validation: `backend/src/services/validator.ts`
- Batch Processing: `backend/src/services/aiExtractor.ts` (extractUniversalRecords)
- Theme Styles: `frontend/app/globals.css` (CSS custom properties)

**Find by Error:**
- 400 NO_FILE_UPLOADED: `backend/src/routes/import.ts`
- 422 INVALID_CSV: `backend/src/services/csvParser.ts`
- 429 Rate Limit: `backend/src/services/aiExtractor.ts` (retry logic)
- 500 AI_PROCESSING_FAILED: `backend/src/routes/import.ts`

---

This structure document is maintained alongside the codebase. Update it when making architectural changes.
