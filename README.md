# 🚀 GrowEasy AI-Powered CSV Importer

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=for-the-badge&logo=node.js)
![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM_API-76B900?style=for-the-badge&logo=nvidia)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**Intelligent CSV importer with dual-mode AI mapping for GrowEasy Real Estate CRM**

[Features](#-key-features) • [Quick Start](#-quick-start-5-minutes) • [Deployment](#-deployment) • [Documentation](./DEPLOYMENT.md)

</div>

---

A production-ready, AI-powered CSV importer with **dual-mode intelligence** designed for GrowEasy Real Estate CRM. Upload any CSV file with arbitrary column names, date formats, and conventions — the AI automatically detects, maps, and structures your data.

## ✨ Key Features

### 🎯 **Dual Import Modes**
- **CRM Mode** (Default): Intelligently maps any lead CSV to 15 standard CRM fields (name, email, mobile, company, city, etc.)
  - Works with Facebook Ads, Google Ads, broker exports, and any lead source
  - Semantic column mapping: "Full Name" → name, "Phone Number" → mobile, etc.
  - No email/phone required — imports records with partial data
  
- **Universal Mode**: Preserves original CSV structure for non-lead data
  - Perfect for products, inventory, sales reports, currency lists, etc.
  - Dynamic schema detection with type inference (string, number, date, currency, etc.)

### 🧠 **AI-Powered Intelligence**
- **Smart Column Mapping**: Understands variations like "Email", "Email Address", "E-mail", "Contact Email"
- **Date Format Detection**: Parses any date format (MM/DD/YYYY, DD-MM-YYYY, ISO 8601, timestamps) and normalizes to ISO 8601
- **Phone Number Normalization**: Extracts country codes and cleans phone numbers automatically
- **Type Inference**: Detects data types (string, number, boolean, date, email, phone, url, currency, percentage)

### 💎 **Porsche-Level UI Design**
- Dark, premium aesthetic with glassmorphism and ambient glow effects
- Motion: Staggered fade-up animations, shimmer text, pulse glow, progress indicators
- Responsive design with smooth transitions and hover effects
- Real-time preview of CSV data before import

### 🛡️ **Production-Ready**
- CSV injection prevention (sanitizes formula prefixes: `=`, `+`, `-`, `@`)
- Rate limit handling with smart retry logic (429 errors)
- Sequential batch processing (10 rows/batch) to respect API limits
- Comprehensive error handling and validation

## 📊 Demo Flow

```
Upload CSV → Preview (first 100 rows) → Confirm → AI Processing → Results
   ↓              ↓                        ↓            ↓            ↓
Choose mode   See columns              Batched      Maps &      Import/Skip
(CRM/Universal) & row count            to AI        Validates    Summary
```

## 📁 Supported CSV Types

| Domain | Example Columns | Test File | Import Mode |
|--------|----------------|-----------|-------------|
| **Facebook Leads** | Date Created, Full Name, Email, Phone, Ad Name | `facebook.csv` | CRM Mode ✅ |
| **Google Ads** | Conversion Time, Customer Name, Phone Number, Email | `google_ads.csv` | CRM Mode ✅ |
| **Broker Exports** | Prospect, Contact, Email ID, City, Remarks, Status | `broker.csv` | CRM Mode ✅ |
| **Currency Data** | Code, Symbol, Name | `currency.csv` | Universal Mode 🌍 |
| **Product Catalog** | SKU, Name, Price, Stock, Category | `products.csv` | Universal Mode 🌍 |
| **Sales Reports** | Date, OrderID, Customer, Amount, Status | `sales.csv` | Universal Mode 🌍 |
| **Inventory** | Item, Quantity, Location, LastUpdated | `inventory.csv` | Universal Mode 🌍 |

The importer is **domain-agnostic** — it intelligently adapts to any CSV structure, whether it's lead data for your CRM or general business data.

## 🎨 Screenshots

<div align="center">

### Upload Screen (CRM Mode)
![Upload Screen - Dark theme with glassmorphism](docs/screenshot-upload.png)
*Premium Porsche-inspired UI with mode selector and drag-and-drop*

### Processing Screen
![AI Processing - Animated spinner with progress bar](docs/screenshot-processing.png)
*Real-time AI mapping with elegant loading states*

### Results Screen
![Results - Imported records with summary](docs/screenshot-results.png)
*Detailed import summary with imported/skipped records*

</div>

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS | Modern React framework with SSR |
| **Backend** | Node.js, Express, TypeScript, Multer | RESTful API with file upload |
| **CSV Parsing** | csv-parse, papaparse | High-performance CSV parsing |
| **AI Engine** | NVIDIA NIM API (`openai/gpt-oss-120b`) | Semantic column mapping & data extraction |
| **Styling** | Custom CSS with glassmorphism, gradients | Porsche-level premium design |
| **Fonts** | Space Grotesk, Inter, JetBrains Mono | Professional typography |
| **Database** | None (stateless) | Request/response only, no persistence |

### 🤖 AI Model: NVIDIA NIM `openai/gpt-oss-120b`

**Model Characteristics:**
- **Type**: Open-source instruction-tuned LLM (120 billion parameters)
- **Strengths**: Good reasoning, structured output, cost-effective
- **Processing Speed**: ~3-8 seconds per batch (10 rows)
- **Token Limits**: 4096 output tokens per request

**⚠️ Performance Note:**
Processing time is intentionally slower due to:
1. **Sequential Batch Processing**: Batches are processed one-by-one (not parallel) to respect NVIDIA API rate limits
2. **Model Efficiency**: The `gpt-oss-120b` model prioritizes accuracy over speed
3. **Typical Import Times**:
   - 10 rows: ~5-10 seconds
   - 50 rows: ~30-45 seconds  
   - 100 rows: ~60-90 seconds
   - 500 rows: ~5-8 minutes

**Upgrade Options:**
You can switch to faster models by changing `NVIDIA_MODEL` in `.env`:
- `meta/llama-3.1-70b-instruct` - Faster, good accuracy
- `nvidia/llama-3.1-nemotron-70b-instruct` - NVIDIA-optimized, balanced speed/quality
- Check [build.nvidia.com](https://build.nvidia.com/explore/discover) for more models

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- **Node.js 20+** ([download](https://nodejs.org/))
- **NVIDIA API Key** (free tier available at [build.nvidia.com](https://build.nvidia.com/explore/discover))

### Local Development Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd groweasy-csv-importer

# 2. Setup Backend
cd backend
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY=nvapi-xxxxx
npm install
npm run dev          # Backend runs on http://localhost:4000

# 3. Setup Frontend (in a new terminal)
cd ../frontend
cp .env.local.example .env.local
# .env.local should have: NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
npm install
npm run dev          # Frontend runs on http://localhost:3000
```

**🎉 Open http://localhost:3000** and start importing CSVs!

### 🐳 Docker Setup (Alternative)

If you prefer Docker:

```bash
# Create environment file
echo "NVIDIA_API_KEY=nvapi-your-key-here" > .env

# Build and run
docker-compose up --build

# Access the app
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

To stop: `docker-compose down`

## 🎯 How to Use

### Step 1: Choose Import Mode

**Before uploading**, select the appropriate mode:

- **🏢 GrowEasy CRM Mode** (Default): 
  - Use for lead data from Facebook Ads, Google Ads, broker spreadsheets, etc.
  - AI maps your columns to 15 standard CRM fields
  - Example: "Full Name" → name, "Email Address" → email, "Phone" → mobile
  
- **🌍 Universal Mode**:
  - Use for non-lead data (products, inventory, sales, currencies, etc.)
  - AI preserves your original columns exactly as they are
  - Example: "Code, Symbol, Name" stays as "Code, Symbol, Name"

### Step 2: Upload CSV

1. **Drag & drop** your CSV file into the upload zone, or **click to browse**
2. Maximum file size: **10 MB**
3. Preview shows first 100 rows with detected columns

### Step 3: Review Preview

- Verify column names are detected correctly
- Check row count matches your expectations
- Click **"Confirm Import"** when ready

### Step 4: Wait for AI Processing

- Backend processes in batches of 10 rows sequentially
- Progress indicator shows AI is working
- **Typical wait times**:
  - Small CSV (10-50 rows): 30-60 seconds ⏱️
  - Medium CSV (100-200 rows): 2-3 minutes ⏱️
  - Large CSV (500+ rows): 5-10 minutes ⏱️

> **💡 Why is it slow?** Sequential batch processing + `gpt-oss-120b` model prioritizes accuracy over speed. For faster imports, upgrade to `meta/llama-3.1-70b-instruct` (see Environment Variables section).

### Step 5: Review Results

- **Summary bar**: Shows total rows, imported, and skipped counts
- **Imported table**: All successfully processed records
- **Skipped table**: Rows that couldn't be processed (with reasons)
- **Download options**: Export results as CSV (future feature)

### 📝 Example Use Cases

**Use Case 1: Import Facebook Lead Ads**
```
Mode: CRM Mode
CSV: "Date Created", "Full Name", "Email", "Phone", "Ad Name"
Result: Maps to created_at, name, email, mobile_without_country_code, description
```

**Use Case 2: Import Product Catalog**
```
Mode: Universal Mode  
CSV: "SKU", "Product Name", "Price", "In Stock"
Result: Preserves as "SKU", "Product Name", "Price", "In Stock"
```

**Use Case 3: Import Currency List**
```
Mode: Universal Mode
CSV: "Code", "Symbol", "Name"
Result: Preserves as "Code", "Symbol", "Name"
```

## ⚙️ Configuration

## Environment variables

**backend/.env** (see `backend/.env.example`)
| Variable | Required | Description |
|---|---|---|
| `NVIDIA_API_KEY` | Yes | API key used for AI-powered data extraction |
| `NVIDIA_MODEL` | No | NVIDIA NIM model ID (default `openai/gpt-oss-120b`) |
| `PORT` | No | Port the Express server listens on (default `4000`) |

**frontend/.env.local** (see `frontend/.env.local.example`)
| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Base URL of the backend API, no trailing slash |

## 🔧 Architecture & API

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Upload → Preview → Confirm → Processing → Results   │  │
│  │  (Mode Selector, Drag & Drop, Tables, Animations)    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP POST /api/import?mode=crm
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Express)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ routes/import.ts  →  csvParser.ts  →  aiExtractor.ts│  │
│  │  (Controller)        (Parse CSV)      (AI Batching)  │  │
│  │                                             ↓         │  │
│  │                                   validator.ts        │  │
│  │                              (Sanitize & Validate)    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ NVIDIA NIM API Call
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  NVIDIA NIM AI Engine                        │
│  Model: openai/gpt-oss-120b (120B parameters)              │
│  • Semantic column mapping                                  │
│  • Data type detection                                      │
│  • Value normalization                                      │
└─────────────────────────────────────────────────────────────┘
```

### Processing Pipeline

1. **Upload & Parse** (csvParser.ts)
   - Multer handles file upload
   - csv-parse converts buffer to rows
   - Validates CSV structure

2. **AI Extraction** (aiExtractor.ts)
   - Chunks rows into batches of 10
   - Selects system prompt based on mode (CRM/Universal)
   - Sequential processing with retry logic (6 attempts max)
   - Parses AI JSON response
   - Detects schema (columns, types, sample values)

3. **Validation** (validator.ts)
   - CSV injection prevention (`=`, `+`, `-`, `@` prefixes)
   - Empty row detection
   - CRM mode: Email/phone validation (warns if missing, still imports)
   - Universal mode: Schema completeness check
   - Metadata integrity validation

4. **Response**
   - Returns imported records, skipped records, detected schema
   - Frontend renders results with type-aware formatting

### API Contract

**Endpoint:** `POST /api/import?mode=<crm|universal>`

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Field name: `file`
- Max size: 10 MB
- Query param: `mode` (optional, defaults to `universal`)

**Success Response (200):**
```json
{
  "success": true,
  "total_rows": 32,
  "total_imported": 32,
  "total_skipped": 0,
  "imported": [ { "Name": "Widget A", "Price": 29.99, "_metadata": { ... } } ],
  "skipped": [],
  "schema": {
    "columns": ["Name", "Price", "In Stock"],
    "column_types": { "Name": "string", "Price": "currency", "In Stock": "boolean" },
    "sample_values": { ... },
    "total_rows": 32
  }
}
```

```

**Error Responses:**
- `400 NO_FILE_UPLOADED` — No file provided, or empty file
- `400 FILE_TOO_LARGE` — File exceeds 10 MB limit
- `422 INVALID_CSV` — File could not be parsed as CSV
- `500 AI_PROCESSING_FAILED` — AI extraction step failed unrecoverably

Every imported record contains **dynamic fields** matching the CSV columns, plus a `_metadata` object with `row_number`, `import_timestamp`, and `field_types`.

## 🧪 Testing

### Unit Tests

```bash
cd backend
npm test
```

**Test Coverage:**
- ✅ CSV injection prevention (`sanitizeCsvValue`)
- ✅ Empty row skipping
- ✅ Schema completeness validation
- ✅ Metadata preservation
- ✅ AI response JSON parsing
- ✅ Schema extraction from AI responses

### Manual Testing with Sample CSVs

Seven sample CSVs in `test-csvs/` cover diverse domains:

```bash
# Test CRM Mode with Facebook leads
curl -X POST "http://localhost:4000/api/import?mode=crm" \
  -F "file=@test-csvs/facebook.csv"

# Test CRM Mode with Google Ads
curl -X POST "http://localhost:4000/api/import?mode=crm" \
  -F "file=@test-csvs/google_ads.csv"

# Test CRM Mode with broker export
curl -X POST "http://localhost:4000/api/import?mode=crm" \
  -F "file=@test-csvs/broker.csv"

# Test Universal Mode with currency data
curl -X POST "http://localhost:4000/api/import?mode=universal" \
  -F "file=@test-csvs/currency.csv"

# Test Universal Mode with products
curl -X POST "http://localhost:4000/api/import?mode=universal" \
  -F "file=@test-csvs/products.csv"

# Test Universal Mode with sales data
curl -X POST "http://localhost:4000/api/import?mode=universal" \
  -F "file=@test-csvs/sales.csv"

# Test Universal Mode with inventory
curl -X POST "http://localhost:4000/api/import?mode=universal" \
  -F "file=@test-csvs/inventory.csv"
```

## 🚀 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for comprehensive deployment guides covering:

- 🐳 **Docker (VPS)** - DigitalOcean, Linode, AWS EC2 ($12-20/mo)
- ⚡ **Vercel + Railway** - Fastest deployment, free tier available
- 🎨 **Render** - Simple all-in-one platform
- ☁️ **AWS/Azure/GCP** - Enterprise-grade with auto-scaling

**Quick start with Docker:**
```bash
# On your server
git clone <your-repo>
cd groweasy-csv-importer
echo "NVIDIA_API_KEY=nvapi-your-key" > .env
docker-compose up -d --build
```

For production, set `NEXT_PUBLIC_API_BASE_URL` in docker-compose.yml to your backend URL.

---

## 📊 Performance & Limitations

### Current Performance Metrics

| CSV Size | Rows | Processing Time | Batches |
|----------|------|-----------------|---------|
| Small | 10-50 | 30-60 seconds | 1-5 batches |
| Medium | 100-200 | 2-3 minutes | 10-20 batches |
| Large | 500+ | 5-10 minutes | 50+ batches |

**Processing Speed Formula:**
```
Time ≈ (Total Rows / 10) × ~5-8 seconds per batch
```

### Known Limitations & Future Improvements

**Current Limitations:**
- ⏱️ **Slow processing**: Sequential batch processing to respect API limits (not parallel)
- 📊 **No real-time progress**: Shows indeterminate spinner, not per-batch progress
- 📄 **No pagination**: Large result sets (10k+ rows) render all DOM rows at once
- 💵 **Currency detection**: Defaults to USD formatting, no locale-aware detection
- 💾 **No export**: Can't download results as CSV yet

**Planned Improvements:**
- ⚡ **SSE streaming**: Real-time per-batch progress updates
- 🔄 **Parallel batching**: Process multiple batches simultaneously with rate limit handling
- 📊 **Virtual scrolling**: Efficient rendering for 10k+ row results
- 💵 **Smart currency detection**: Auto-detect currency symbols and locale
- 💾 **Export functionality**: Download imported records as CSV
- 🔍 **Column filtering**: Search and filter results table
- 📊 **Advanced analytics**: Charts showing data distribution, type breakdown
- 🤖 **Model selection UI**: Choose AI model from dropdown
- 🔄 **Auto-retry failed batches**: Intelligent retry for temporary API failures

### Why Not Parallel Processing?

**Current:** Sequential (one batch after another)
```
Batch 1 → wait → Batch 2 → wait → Batch 3 → wait → ...
```

**Future:** Parallel with rate limit awareness
```
Batch 1 ┐
Batch 2 ├─→ Process concurrently (respecting rate limits)
Batch 3 ┘
```

Currently using sequential to:
1. ✅ Respect NVIDIA API rate limits (avoid 429 errors)
2. ✅ Ensure consistent column mapping across batches
3. ✅ Simplify error handling and retry logic

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `npm test`
5. **Commit**: `git commit -m "Add amazing feature"`
6. **Push**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation for API changes
- Use meaningful commit messages
- Keep PRs focused and small

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **NVIDIA NIM** for providing the AI inference API
- **Next.js** team for the excellent React framework
- **Tailwind CSS** for the utility-first CSS framework
- **papaparse** & **csv-parse** for robust CSV parsing
- **Porsche Design System** for UI/UX inspiration

---

## 📧 Support

For questions, issues, or feature requests:
- 🐛 **Report bugs**: [GitHub Issues](https://github.com/your-repo/issues)
- 💡 **Request features**: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📧 **Email**: support@groweasy.com
- 📚 **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guides

---

## 🚀 Built by GrowEasy

**GrowEasy** - AI-Powered Real Estate CRM  
Transforming lead management for real estate professionals.

[Website](https://groweasy.com) • [Twitter](https://twitter.com/groweasy) • [LinkedIn](https://linkedin.com/company/groweasy)
