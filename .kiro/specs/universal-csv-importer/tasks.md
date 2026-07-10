# Implementation Tasks: Universal CSV Importer

## Overview
This document breaks down the universal CSV importer transformation into actionable tasks. Tasks are ordered by dependency and grouped by component.

**Total Estimated Effort:** 40-50 hours
**Implementation Timeline:** 2-3 weeks

---

## Phase 1: Type System Foundation (8-10 hours)

### Task 1: Create Universal Types
**Status:** done  
**Estimated Effort:** 2 hours  
**Files:**
- `backend/src/types/universal.ts` (create)
- `backend/src/types/crm.ts` (deprecate)

**Description:**
Create new universal type definitions including UniversalRecord, RecordMetadata, DetectedSchema, DataType enum, and all API response interfaces. These types will form the foundation for the entire refactor.

**Acceptance Criteria:**
- [x] UniversalRecord interface with dynamic fields and _metadata
- [x] RecordMetadata interface with row_number, import_timestamp, field_types
- [x] DataType enum with all 10 types (string, number, boolean, date, email, phone, url, currency, percentage, unknown)
- [x] DetectedSchema interface with columns, column_types, sample_values
- [x] ImportSuccessResponse updated to use UniversalRecord[]
- [x] SkippedRecord includes row_number field
- [x] All types properly exported

**Dependencies:** None

---

### Task 2: Update Backend Type Imports
**Status:** done  
**Estimated Effort:** 1 hour  
**Files:**
- `backend/src/services/aiExtractor.ts` (modify)
- `backend/src/services/validator.ts` (modify)
- `backend/src/routes/import.ts` (modify)
- `backend/src/services/csvParser.ts` (modify)

**Description:**
Replace all CRM-specific type imports with universal types throughout backend codebase. Update function signatures and type annotations.

**Acceptance Criteria:**
- [x] All CrmRecord references replaced with UniversalRecord
- [x] All CrmStatus references removed
- [x] All DataSource references removed
- [x] AiBatchResult type updated
- [x] No TypeScript compilation errors
- [x] All imports point to universal.ts

**Dependencies:** Task 1

---

### Task 3: Remove CRM Constants
**Status:** done  
**Estimated Effort:** 1 hour  
**Files:**
- `backend/src/constants/crm.ts` (modify or rename to config.ts)

**Description:**
Remove CRM-specific constants while preserving universal configuration values (BATCH_SIZE, MAX_FILE_SIZE_BYTES, etc).

**Acceptance Criteria:**
- [x] CRM_STATUS_VALUES constant removed
- [x] DATA_SOURCE_VALUES constant removed
- [x] CRM_RECORD_FIELDS constant removed
- [x] isValidCrmStatus function removed
- [x] isValidDataSource function removed
- [x] BATCH_SIZE, MAX_FILE_SIZE_BYTES preserved
- [x] File optionally renamed to config.ts

**Dependencies:** Task 2

---

### Task 4: Update Frontend Types
**Status:** done  
**Estimated Effort:** 2 hours  
**Files:**
- `frontend/types/universal.ts` (create)
- `frontend/types/crm.ts` (deprecate)
- `frontend/hooks/useCSVImport.ts` (modify)
- `frontend/components/*.tsx` (modify imports)

**Description:**
Create frontend universal types (re-exporting backend types) and update all component imports.

**Acceptance Criteria:**
- [x] frontend/types/universal.ts created
- [x] All backend types re-exported for frontend use
- [x] UploadState type preserved
- [x] CsvPreview type preserved
- [x] All component imports updated
- [x] useCSVImport hook updated
- [x] No TypeScript compilation errors

**Dependencies:** Task 1

---

## Phase 2: AI & Validation Layer (12-15 hours)

### Task 5: Design Universal AI Prompt
**Status:** done  
**Estimated Effort:** 3 hours  
**Files:**
- `backend/src/services/aiExtractor.ts` (modify)

**Description:**
Replace CRM-specific SYSTEM_PROMPT with domain-agnostic universal prompt that includes schema detection, data type inference, and generic field mapping instructions.

**Acceptance Criteria:**
- [x] No CRM terminology (leads, real estate, contacts)
- [x] Instructions for detecting any CSV structure
- [x] Data type inference rules for all 10 types
- [x] Date normalization rules (any format → ISO 8601)
- [x] Boolean normalization rules (yes/no → true/false)
- [x] Numeric normalization rules
- [x] Skip only completely empty rows
- [x] Include detected_schema in output
- [x] Preserve all column names exactly
- [x] No email/phone requirements

**Dependencies:** Task 1

---

### Task 6: Update AI Extractor Function
**Status:** done  
**Estimated Effort:** 2 hours  
**Files:**
- `backend/src/services/aiExtractor.ts` (modify)

**Description:**
Rename extractCrmRecords → extractUniversalRecords, update return type, and add schema extraction logic.

**Acceptance Criteria:**
- [x] Function renamed to extractUniversalRecords
- [x] Return type changed to AiBatchResult with UniversalRecord[]
- [x] Parse detected_schema from AI response
- [x] Validate AI response includes _metadata on all records
- [x] Add validateAiResponse helper function
- [x] Update error handling for missing schema
- [x] Remove CRM-specific validation logic
- [x] Update all function callers

**Dependencies:** Task 5

---

### Task 7: Implement Universal Validator
**Status:** done  
**Estimated Effort:** 3 hours  
**Files:**
- `backend/src/services/validator.ts` (modify)

**Description:**
Rewrite validator to remove domain-specific rules and implement universal sanitization.

**Acceptance Criteria:**
- [x] Remove email/phone validation requirement
- [x] Remove CrmStatus enum validation
- [x] Remove DataSource enum validation
- [x] Implement CSV injection prevention (sanitizeCsvValue)
- [x] Implement validateRecordCompleteness function
- [x] Skip only completely empty rows
- [x] Preserve all data types (string, number, boolean)
- [x] Add metadata validation
- [x] Update validateAiOutput signature to accept DetectedSchema

**Dependencies:** Task 1, Task 6

---

### Task 8: Update Import Route Handler
**Status:** done  
**Estimated Effort:** 2 hours  
**Files:**
- `backend/src/routes/import.ts` (modify)

**Description:**
Update route handler to call extractUniversalRecords, pass schema to validator, and include schema in response.

**Acceptance Criteria:**
- [x] Call extractUniversalRecords instead of extractCrmRecords
- [x] Extract schema from AI result
- [x] Pass schema to validateAiOutput
- [x] Include schema in ImportSuccessResponse
- [x] Update error messages to be domain-agnostic
- [x] Remove CRM-specific error handling
- [x] Update response type annotations

**Dependencies:** Task 6, Task 7

---

### Task 9: Add Schema Detection Logging
**Status:** done  
**Estimated Effort:** 1 hour  
**Files:**
- `backend/src/services/aiExtractor.ts` (modify)
- `backend/src/routes/import.ts` (modify)

**Description:**
Add console logging for detected schema to aid debugging and monitoring.

**Acceptance Criteria:**
- [x] Log detected schema after AI processing
- [x] Log column types and sample values
- [x] Log schema validation failures
- [x] Use structured log format for parsing
- [x] Don't log PII (actual data values)

**Dependencies:** Task 6

---

## Phase 3: Frontend Components (10-12 hours)

### Task 10: Refactor ResultsTable Component
**Status:** done  
**Estimated Effort:** 3 hours  
**Files:**
- `frontend/components/ResultsTable.tsx` (modify)

**Description:**
Make ResultsTable dynamically render columns from UniversalRecord data instead of hardcoded CRM fields.

**Acceptance Criteria:**
- [x] Extract columns from first record dynamically
- [x] Render all columns except _metadata
- [x] Implement formatValue function with type-aware formatting
- [x] Handle date formatting (ISO → locale string)
- [x] Handle boolean formatting (true/false → ✓/✗)
- [x] Handle currency formatting
- [x] Handle percentage formatting
- [x] Remove CRM_RECORD_FIELDS constant usage
- [x] Remove STATUS_CONFIG hardcoded logic
- [x] Remove FIELD_LABELS hardcoded mapping
- [x] Add horizontal scroll for wide tables

**Dependencies:** Task 4

---

### Task 11: Refactor PreviewTable Component
**Status:** done  
**Estimated Effort:** 1 hour  
**Files:**
- `frontend/components/PreviewTable.tsx` (modify)

**Description:**
Ensure PreviewTable already renders columns dynamically (verify current implementation works for any CSV).

**Acceptance Criteria:**
- [x] Verify columns prop is used dynamically
- [x] Verify rows render all columns
- [x] Add type-aware cell styling if needed
- [x] Test with 3-column and 50-column CSVs
- [x] Ensure horizontal scrolling works

**Dependencies:** Task 4

---

### Task 12: Update SkippedTable Component
**Status:** done  
**Estimated Effort:** 1 hour  
**Files:**
- `frontend/components/SkippedTable.tsx` (modify)

**Description:**
Update SkippedTable to display row_number and ensure it works with any CSV structure.

**Acceptance Criteria:**
- [x] Display row_number in table
- [x] Render original_row JSON for any structure
- [x] Update reason display for generic skip reasons
- [x] Remove CRM-specific reason text
- [x] Test with diverse skip scenarios

**Dependencies:** Task 4

---

### Task 13: Update UI Labels
**Status:** done  
**Estimated Effort:** 1 hour  
**Files:**
- `frontend/app/page.tsx` (modify)
- `frontend/components/UploadZone.tsx` (modify)

**Description:**
Replace CRM-specific labels with universal messaging.

**Acceptance Criteria:**
- [x] "Import Leads Instantly" → "Import Any CSV"
- [x] "AI maps every column to your CRM automatically" → "AI maps every column automatically"
- [x] Remove "GrowEasy CRM" references → "Universal CSV Importer"
- [x] Update error messages to be domain-agnostic
- [x] Update UploadZone description
- [x] Update page title and metadata

**Dependencies:** None

---

### Task 14: Update SummaryBar Component
**Status:** done  
**Estimated Effort:** 1 hour  
**Files:**
- `frontend/components/SummaryBar.tsx` (modify)

**Description:**
Update labels and stats to be generic (already mostly universal, verify).

**Acceptance Criteria:**
- [x] Verify labels are domain-agnostic
- [x] "Processed" stat works for any CSV
- [x] "Imported" stat color coding works
- [x] "Skipped" stat handles zero skips
- [x] "Import Rate" calculation works
- [x] Test with 100% import rate scenarios

**Dependencies:** Task 4

---

### Task 15: Update useCSVImport Hook
**Status:** done  
**Estimated Effort:** 2 hours  
**Files:**
- `frontend/hooks/useCSVImport.ts` (modify)

**Description:**
Update hook to handle UniversalRecord[] response and schema in result.

**Acceptance Criteria:**
- [x] Update ImportSuccessResponse type usage
- [x] Handle schema field in response
- [x] Update error message handling (no CRM errors)
- [x] Test with diverse CSV types
- [x] Ensure preview still works
- [x] Ensure results rendering works

**Dependencies:** Task 4, Task 8

---

## Phase 4: Testing & Validation (8-10 hours)

### Task 16: Create Diverse Test CSVs
**Status:** done  
**Estimated Effort:** 2 hours  
**Files:**
- `test-csvs/currency.csv` (create)
- `test-csvs/products.csv` (create)
- `test-csvs/sales.csv` (create)
- `test-csvs/inventory.csv` (create)

**Description:**
Create test CSV files representing diverse domains to validate universal import capability.

**Acceptance Criteria:**
- [x] currency.csv (Code, Symbol, Name) - 20+ rows
- [x] products.csv (SKU, Name, Price, Stock, Category) - 30+ rows
- [x] sales.csv (Date, OrderID, Customer, Amount, Status) - 25+ rows
- [x] inventory.csv (Item, Quantity, Location, LastUpdated) - 20+ rows
- [x] Each CSV has different column count
- [x] Include various data types in each CSV
- [x] Include edge cases (empty cells, special characters)

**Dependencies:** None

---

### Task 17: Test Backend with Diverse CSVs
**Status:** done  
**Estimated Effort:** 2 hours  
**Files:**
- N/A (manual testing)

**Description:**
Test backend API with all test CSVs and verify 100% import success.

**Acceptance Criteria:**
- [x] currency.csv imports 100% of rows
- [x] products.csv imports 100% of rows
- [x] sales.csv imports 100% of rows
- [x] inventory.csv imports 100% of rows
- [x] facebook.csv still imports successfully (backward compat)
- [x] google_ads.csv still imports successfully
- [x] broker.csv still imports successfully
- [x] Verify detected_schema in all responses
- [x] Verify field_types are correctly detected
- [x] No rows skipped except completely empty

**Dependencies:** Task 8, Task 16

---

### Task 18: Test Frontend Rendering
**Status:** done  
**Estimated Effort:** 2 hours  
**Files:**
- N/A (manual testing)

**Description:**
Test frontend with all test CSVs and verify dynamic rendering.

**Acceptance Criteria:**
- [x] ResultsTable renders 3-column CSV correctly
- [x] ResultsTable renders 10-column CSV correctly
- [x] ResultsTable renders 50-column CSV correctly
- [x] Horizontal scrolling works for wide tables
- [x] Type-aware formatting works (dates, booleans, currency)
- [x] Preview table shows correct columns
- [x] SummaryBar shows correct stats
- [x] No layout breaks with diverse schemas

**Dependencies:** Task 10, Task 17

---

### Task 19: Add Backend Unit Tests
**Status:** done  
**Estimated Effort:** 3 hours  
**Files:**
- `backend/src/services/__tests__/validator.test.ts` (create)
- `backend/src/services/__tests__/aiExtractor.test.ts` (modify)

**Description:**
Write unit tests for universal validator and AI extractor.

**Acceptance Criteria:**
- [x] Test CSV injection prevention
- [x] Test completely empty row skipping
- [x] Test schema completeness validation
- [x] Test metadata preservation
- [x] Test data type sanitization
- [x] Test AI response validation
- [x] Test schema extraction
- [x] All tests pass

**Dependencies:** Task 7, Task 8

---

## Phase 5: Integration & Polish (4-6 hours)

### Task 20: Update README
**Status:** done  
**Estimated Effort:** 1 hour  
**Files:**
- `README.md` (modify)

**Description:**
Update documentation to reflect universal CSV capability.

**Acceptance Criteria:**
- [x] Update project description
- [x] Add examples of supported CSV types
- [x] Update feature list
- [x] Add schema detection documentation
- [x] Update setup instructions if needed
- [x] Add testing instructions for diverse CSVs

**Dependencies:** None

---

### Task 21: Clean Up Deprecated Files
**Status:** done  
**Estimated Effort:** 1 hour  
**Files:**
- `backend/src/types/crm.ts` (delete or mark deprecated)
- `frontend/types/crm.ts` (delete or mark deprecated)

**Description:**
Remove or clearly mark deprecated CRM-specific type files.

**Acceptance Criteria:**
- [x] Verify no imports reference old files
- [x] Add deprecation notices to old files
- [x] Create migration guide comment
- [x] Or delete files entirely if safe

**Dependencies:** All previous tasks

---

### Task 22: End-to-End Integration Test
**Status:** done  
**Estimated Effort:** 2 hours  
**Files:**
- N/A (E2E testing)

**Description:**
Perform complete end-to-end test of full import flow with multiple CSV types.

**Acceptance Criteria:**
- [x] Upload currency.csv → verify full import → verify display
- [x] Upload products.csv → verify full import → verify display
- [x] Upload sales.csv → verify full import → verify display
- [x] Upload facebook.csv → verify backward compatibility
- [x] Test error scenarios (invalid CSV, empty file)
- [x] Test large CSV (1000+ rows)
- [x] Verify no CRM terminology in UI
- [x] Verify all rows processed successfully

**Dependencies:** All previous tasks

---

### Task 23: Performance Testing
**Status:** done  
**Estimated Effort:** 2 hours  
**Files:**
- N/A (performance testing)

**Description:**
Test system performance with large and wide CSVs.

**Acceptance Criteria:**
- [x] Test with 10,000 row CSV
- [x] Test with 100 column CSV
- [x] Measure AI processing time
- [x] Measure frontend rendering time
- [x] Verify no memory leaks
- [x] Verify batch processing works efficiently
- [x] Document performance characteristics

**Dependencies:** Task 22

---

## Summary

**Task Breakdown by Phase:**
- Phase 1 (Types): 4 tasks, 8-10 hours
- Phase 2 (Backend): 5 tasks, 12-15 hours
- Phase 3 (Frontend): 6 tasks, 10-12 hours
- Phase 4 (Testing): 4 tasks, 8-10 hours
- Phase 5 (Integration): 4 tasks, 4-6 hours

**Total:** 23 tasks, 40-50 hours, 2-3 weeks

**Critical Path:**
Task 1 → Task 2 → Task 3 → Task 5 → Task 6 → Task 7 → Task 8 → Task 17 → Task 22

**Recommended Order:**
1. Complete Phase 1 (types foundation)
2. Complete Phase 2 (backend logic)
3. Complete Phase 3 (frontend rendering)
4. Complete Phase 4 (testing)
5. Complete Phase 5 (integration & polish)
