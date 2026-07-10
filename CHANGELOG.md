# Changelog

All notable changes to the GrowEasy CSV Importer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### 🎉 Initial Release

#### Added
- **Dual-Mode Import System**
  - CRM Mode: Maps any lead CSV to 15 standard CRM fields
  - Universal Mode: Preserves original CSV structure for non-lead data
  
- **AI-Powered Column Mapping**
  - NVIDIA NIM API integration with `openai/gpt-oss-120b` model
  - Semantic column understanding (e.g., "Full Name" → name, "Email Address" → email)
  - Intelligent date format detection and normalization
  - Phone number extraction with country code splitting
  - Data type inference (string, number, date, email, phone, currency, percentage, boolean)

- **Premium UI/UX**
  - Porsche-inspired dark theme with glassmorphism effects
  - Mode selector toggle for CRM/Universal modes
  - Drag & drop file upload with validation
  - Real-time CSV preview (first 100 rows)
  - Animated processing states with progress indicators
  - Type-aware result tables with formatting (dates, currency, booleans)
  - Summary statistics bar
  - Responsive design for mobile/tablet/desktop

- **Robust Backend**
  - Express.js REST API with TypeScript
  - Sequential batch processing (10 rows/batch) to respect rate limits
  - Smart retry logic with exponential backoff (6 attempts max)
  - 429 rate limit detection with "try again in Xs" parsing
  - CSV injection prevention for spreadsheet security
  - Comprehensive validation and error handling

- **Testing Infrastructure**
  - Jest unit tests for AI extraction and validation
  - 7 sample CSV files covering diverse use cases
  - Manual testing endpoints documented

- **Deployment Ready**
  - Docker Compose configuration for easy deployment
  - Multi-stage Dockerfiles for optimized production builds
  - Comprehensive deployment guide (DEPLOYMENT.md)
  - Support for VPS, Vercel, Railway, Render, AWS/Azure/GCP

- **Documentation**
  - Detailed README with quickstart guide
  - Architecture diagrams and API contracts
  - Environment variable reference
  - Project structure documentation
  - Deployment guide with 4 platform options

#### Technical Details
- Next.js 14 with App Router
- Node.js 20+ backend
- TypeScript throughout
- NVIDIA NIM AI integration
- Rate limit-aware batch processing
- CSV parsing with csv-parse and papaparse
- 10 MB file size limit
- Stateless architecture (no database)

---

## [Unreleased]

### Planned Features
- [ ] SSE streaming for real-time per-batch progress
- [ ] Parallel batch processing with rate limit awareness
- [ ] Virtual scrolling for 10k+ row results
- [ ] Export results as CSV
- [ ] Advanced filtering and search in results
- [ ] Column type override UI
- [ ] Model selection dropdown
- [ ] Analytics dashboard (data distribution charts)
- [ ] Locale-aware currency detection
- [ ] Auto-retry failed batches
- [ ] Webhook notifications for large imports
- [ ] Import history and session management
- [ ] Batch import API for programmatic access

### Known Issues
- Processing time can be slow for large CSVs (5-10 min for 500+ rows)
- No pagination for large result sets
- Currency formatting defaults to USD
- No export functionality yet

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| **1.0.0** | 2024-01-15 | Initial release with dual-mode AI import |

---

## Migration Guide

### From 0.x to 1.0.0

If you were using an earlier version:

1. **Environment Variables Changed**:
   ```bash
   # Old
   ANTHROPIC_API_KEY=sk-ant-xxx
   
   # New
   NVIDIA_API_KEY=nvapi-xxx
   NVIDIA_MODEL=openai/gpt-oss-120b  # Optional
   ```

2. **API Endpoint Updated**:
   ```bash
   # Old
   POST /api/import
   
   # New
   POST /api/import?mode=crm
   POST /api/import?mode=universal
   ```

3. **Response Schema Enhanced**:
   - Added `detected_schema` with column types
   - Added `_metadata` to each record with type information
   - CRM mode now imports records without email/phone (no longer skips)

4. **UI Changes**:
   - New mode selector replaces single-mode interface
   - Updated to Porsche-style premium design
   - Dynamic labels based on selected mode

---

## Deprecation Notices

### Deprecated in 1.0.0
- None (initial release)

### Removed in 1.0.0
- Anthropic Claude API support (switched to NVIDIA NIM)

---

## Contributors

Special thanks to:
- **Kiro AI** - Development assistance
- **NVIDIA** - NIM API platform
- **GrowEasy Team** - Product requirements and testing

---

For detailed changes, see the [commit history](https://github.com/your-repo/commits/main).
