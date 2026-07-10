# Technical Design Document: Universal CSV Importer

## 1. Executive Summary

This document provides the technical design for transforming the GrowEasy CSV Importer from a CRM-specific lead importer into a **universal CSV importer** capable of processing any CSV file type. The transformation eliminates hardcoded CRM domain logic, introduces dynamic schema detection, and enables the system to handle diverse data types (product catalogs, financial records, inventory lists, currency tables, sales reports, etc.).

### Key Design Goals

1. **Domain Agnostic**: Remove all CRM-specific types, validation rules, and terminology
2. **Dynamic Schema**: Automatically detect and adapt to any CSV structure
3. **Zero Data Loss**: Process all rows without arbitrary skip rules
4. **Backward Compatible**: Successfully import existing CRM test files
5. **Type Safe**: Maintain TypeScript type safety with flexible record structures

### Transformation Scope

| Component | Current State | Target State |
|-----------|--------------|--------------|
| Type System | Hardcoded `CrmRecord` with 15 fixed fields | Dynamic `UniversalRecord` with flexible schema |
| AI Prompt | CRM-specific instructions (leads, contacts, real estate) | Generic data extraction instructions |
| Validation | Email OR phone required, enum validation | Universal sanitization, no domain rules |
| Frontend | Fixed CRM columns, status badges | Dynamic column rendering |
| Skip Logic | Skip rows without email/phone | Skip only completely empty rows |

---

## 2. Architecture Overview

### 2.1 Current Architecture (CRM-Specific)

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌────────────┐     ┌──────────────┐    ┌──────────────┐   │
│  │ UploadZone │────▶│ useCSVImport │───▶│ ResultsTable │   │
│  └────────────┘     └──────────────┘    └──────────────┘   │
│                            │                     │           │
│                            │                     │           │
│                     POST /import          Display CrmRecord │
│                            │                (15 fixed cols) │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│  ┌────────────┐     ┌──────────────┐    ┌──────────────┐   │
│  │   Router   │────▶│  CSV Parser  │───▶│ AI Extractor │   │
│  │ import.ts  │     │ csvParser.ts │    │aiExtractor.ts│   │
│  └────────────┘     └──────────────┘    └──────────────┘   │
│                            │                     │           │
│                            │                     │           │
│                     RawCsvRow[]          Partial<CrmRecord>│
│                            │                     │           │
│                            ▼                     ▼           │
│                     ┌──────────────┐    ┌──────────────┐   │
│                     │  Validator   │◀───│  CRM Types   │   │
│                     │ validator.ts │    │   crm.ts     │   │
│                     └──────────────┘    └──────────────┘   │
│                            │                     │           │
│                     Validates email/phone    CrmRecord      │
│                     CrmStatus enums          CrmStatus      │
│                     DataSource enums         DataSource     │
└─────────────────────────────────────────────────────────────┘
```

**Problems with Current Architecture:**
- Hardcoded CRM field expectations throughout the stack
- AI prompt contains real estate domain knowledge
- Validator enforces contact information requirements
- Frontend components assume fixed 15-column schema
- Enum types limit flexibility (CrmStatus, DataSource)


### 2.2 New Architecture (Universal)

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌────────────┐     ┌──────────────┐    ┌──────────────┐   │
│  │ UploadZone │────▶│ useCSVImport │───▶│ ResultsTable │   │
│  └────────────┘     └──────────────┘    └──────────────┘   │
│       │                    │                     │           │
│  "Import Any CSV"   POST /import        Dynamic Columns     │
│  Generic labels           │             (renders any schema)│
│                            │                     │           │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│  ┌────────────┐     ┌──────────────┐    ┌──────────────┐   │
│  │   Router   │────▶│  CSV Parser  │───▶│ AI Extractor │   │
│  │ import.ts  │     │ csvParser.ts │    │aiExtractor.ts│   │
│  └────────────┘     └──────────────┘    └──────────────┘   │
│                            │                     │           │
│                            │                     │           │
│                     RawCsvRow[]          UniversalRecord[]   │
│                     (any structure)      (dynamic schema)    │
│                            │                     │           │
│                            ▼                     ▼           │
│                     ┌──────────────┐    ┌──────────────┐   │
│                     │  Validator   │◀───│ Universal    │   │
│                     │ validator.ts │    │   Types      │   │
│                     └──────────────┘    └──────────────┘   │
│                            │                     │           │
│                     Sanitizes values         UniversalRecord│
│                     No domain rules          RecordMetadata │
│                     CSV injection check      (flexible)     │
└─────────────────────────────────────────────────────────────┘
```

**Key Architecture Changes:**

1. **Flexible Type System**: Replace fixed `CrmRecord` with dynamic `UniversalRecord`
2. **Schema-Agnostic AI**: Generic prompt that analyzes any CSV structure
3. **Universal Validation**: Sanitization without domain-specific rules
4. **Dynamic UI**: Frontend adapts to any column structure
5. **Metadata Layer**: Track import context without hardcoded fields

---

## 3. Type System Refactoring

### 3.1 Remove CRM-Specific Types

**Files to Modify:**
- `backend/src/types/crm.ts` → rename to `universal.ts`
- `backend/src/constants/crm.ts` → rename to `config.ts`
- `frontend/types/crm.ts` → rename to `universal.ts`

**Types to Remove:**
```typescript
// ❌ REMOVE: CrmRecord interface
export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  // ... 12 more hardcoded fields
}

// ❌ REMOVE: CrmStatus enum
export type CrmStatus = 
  | "GOOD_LEAD_FOLLOW_UP" 
  | "DID_NOT_CONNECT" 
  | "BAD_LEAD" 
  | "SALE_DONE";

// ❌ REMOVE: DataSource enum
export type DataSource = 
  | "leads_on_demand" 
  | "meridian_tower" 
  | "eden_park" 
  | "varah_swamy" 
  | "sarjapur_plots";

// ❌ REMOVE: CRM_RECORD_FIELDS constant
export const CRM_RECORD_FIELDS = [...] as const;
```


### 3.2 Introduce UniversalRecord Interface

**New Type Definition** (`backend/src/types/universal.ts`):

```typescript
/**
 * UniversalRecord represents a single row from any CSV file.
 * Fields are dynamically determined from CSV headers.
 */
export interface UniversalRecord {
  /** Dynamic fields from CSV columns */
  [key: string]: string | number | boolean | null;
  
  /** Metadata fields (prefixed with underscore to avoid column conflicts) */
  _metadata: RecordMetadata;
}

/**
 * Metadata tracked for every imported record
 */
export interface RecordMetadata {
  /** Original row number in the CSV file (1-indexed) */
  row_number: number;
  
  /** ISO 8601 timestamp when record was imported */
  import_timestamp: string;
  
  /** Detected data types for each field */
  field_types: Record<string, DataType>;
  
  /** Confidence scores from AI analysis (0-1) */
  confidence_scores?: Record<string, number>;
}

/**
 * Data type classifications
 */
export type DataType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "email"
  | "phone"
  | "url"
  | "currency"
  | "percentage"
  | "unknown";

/**
 * Schema definition detected from CSV
 */
export interface DetectedSchema {
  /** Column names from CSV headers */
  columns: string[];
  
  /** Inferred data type for each column */
  column_types: Record<string, DataType>;
  
  /** Sample values for each column (first 3 non-empty) */
  sample_values: Record<string, string[]>;
  
  /** Total number of rows in CSV */
  total_rows: number;
}

/**
 * Record that was skipped during import
 */
export interface SkippedRecord {
  /** Original row data exactly as it appeared in CSV */
  original_row: Record<string, unknown>;
  
  /** Human-readable reason for skipping */
  reason: string;
  
  /** Row number in original CSV (1-indexed) */
  row_number: number;
}
```

**Design Rationale:**
- **`[key: string]` index signature**: Allows any column name from CSV
- **`_metadata` prefix**: Avoids conflicts with CSV columns named "metadata"
- **`RecordMetadata`**: Tracks provenance without polluting data fields
- **`DataType` enum**: Enables type-aware rendering in UI
- **`DetectedSchema`**: Provides schema preview before import


### 3.3 API Response Types

**New Response Interfaces** (`backend/src/types/universal.ts`):

```typescript
/**
 * Raw CSV row as parsed (before AI processing)
 */
export type RawCsvRow = Record<string, string>;

/**
 * Result from AI batch processing
 */
export interface AiBatchResult {
  /** Successfully processed records */
  imported: UniversalRecord[];
  
  /** Records that could not be processed */
  skipped: SkippedRecord[];
  
  /** Detected schema from this batch */
  detected_schema?: DetectedSchema;
}

/**
 * Successful import response
 */
export interface ImportSuccessResponse {
  success: true;
  
  /** Total rows in uploaded CSV */
  total_rows: number;
  
  /** Number of successfully imported records */
  total_imported: number;
  
  /** Number of skipped records */
  total_skipped: number;
  
  /** Imported records with full data */
  imported: UniversalRecord[];
  
  /** Skipped records with reasons */
  skipped: SkippedRecord[];
  
  /** Detected schema for the CSV */
  schema: DetectedSchema;
}

/**
 * Error codes for import failures
 */
export type ImportErrorCode =
  | "NO_FILE_UPLOADED"
  | "INVALID_CSV"
  | "AI_PROCESSING_FAILED"
  | "FILE_TOO_LARGE"
  | "EMPTY_CSV"
  | "UNSUPPORTED_ENCODING";

/**
 * Error response for failed imports
 */
export interface ImportErrorResponse {
  success: false;
  error: ImportErrorCode;
  message: string;
  details?: string; // Optional technical details for debugging
}

/**
 * Union type for all import responses
 */
export type ImportResponse = ImportSuccessResponse | ImportErrorResponse;
```

**Changes from Current API:**
- ✅ Add `schema` field to success response for frontend preview
- ✅ Add `row_number` to `SkippedRecord` for better debugging
- ✅ Add `details` field to error response for technical info
- ✅ Replace `CrmRecord[]` with `UniversalRecord[]`

---

## 4. AI Prompt Redesign

### 4.1 Current AI Prompt Analysis

**Problems with Current Prompt:**
```typescript
const SYSTEM_PROMPT = `You are a data-extraction engine for GrowEasy, a real estate CRM.
// ❌ Hardcoded to real estate domain
// ❌ References specific CRM fields by name
// ❌ Contains CrmStatus enum values
// ❌ Contains DataSource enum values
// ❌ Requires email OR phone validation
// ❌ Instructs AI to skip rows without contact info
```


### 4.2 New Universal AI Prompt

**Design Principles:**
1. **Domain Agnostic**: No references to CRM, real estate, or leads
2. **Schema Discovery**: AI must detect structure from headers and content
3. **Type Inference**: AI identifies data types from patterns
4. **Zero Hallucination**: AI must never invent data
5. **Preserve Everything**: No arbitrary skip rules

**New System Prompt** (`backend/src/services/aiExtractor.ts`):

```typescript
const SYSTEM_PROMPT = `You are a universal CSV data extraction and structuring engine.

TASK
You will receive raw CSV rows from any data source with arbitrary column headers, formats,
and conventions. Your job is to:
1. Preserve all data exactly as provided (never invent or hallucinate values)
2. Detect data types for each field based on content patterns
3. Normalize date and numeric formats to standard representations
4. Return structured records matching the CSV schema

OUTPUT SCHEMA
Return a single JSON object with exactly these fields:
{
  "imported": [ <array of record objects> ],
  "skipped": [ <array of skipped records with reasons> ],
  "detected_schema": {
    "columns": [ <array of column names> ],
    "column_types": { <column_name>: <data_type>, ... },
    "sample_values": { <column_name>: [<val1>, <val2>, <val3>], ... },
    "total_rows": <number>
  }
}

RECORD STRUCTURE
Each record in "imported" must:
- Contain a key-value pair for EVERY column from the CSV headers
- Use the exact column name from the CSV as the key (preserve case and spacing)
- Include a "_metadata" field with:
  - "row_number": the 1-indexed row number from the CSV
  - "field_types": detected DataType for each field
  - "import_timestamp": ISO 8601 timestamp of processing

Example record:
{
  "Product Name": "Widget A",
  "SKU": "WDG-001",
  "Price": 29.99,
  "In Stock": true,
  "_metadata": {
    "row_number": 1,
    "field_types": {
      "Product Name": "string",
      "SKU": "string",
      "Price": "currency",
      "In Stock": "boolean"
    },
    "import_timestamp": "2024-01-15T10:30:00.000Z"
  }
}

DATA TYPE DETECTION
Analyze each field's content and assign one of these types:
- "string": Free text, names, descriptions, codes
- "number": Numeric values without currency symbols (integers or decimals)
- "boolean": True/false values (yes/no, Y/N, 1/0, true/false)
- "date": Date/time values in any format
- "email": Email addresses (contains @ with domain)
- "phone": Phone numbers (with or without country codes)
- "url": Web addresses (http:// or https://)
- "currency": Monetary values (may include symbols like $, €, ₹)
- "percentage": Percentage values (may include % symbol)
- "unknown": Cannot confidently determine type

DATE NORMALIZATION
When a field is detected as "date" type:
- Parse ANY input date format (MM/DD/YYYY, DD-MM-YYYY, "Jan 15, 2024", timestamps, etc.)
- Convert to ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
- If time is not present, use 00:00:00.000Z
- If parsing fails, preserve original string and set type to "string"

NUMERIC NORMALIZATION
When a field is detected as "number" or "currency":
- Remove thousands separators (commas, spaces, periods in European format)
- Preserve decimal precision exactly as in source
- For currency, preserve the numeric value (remove symbol) and note currency in field_types
- For percentages, store as decimal (e.g., "25%" → 0.25) or preserve string based on context

BOOLEAN NORMALIZATION
Detect boolean patterns and convert to true/false:
- "yes", "y", "true", "1", "on" → true
- "no", "n", "false", "0", "off" → false
- Case-insensitive matching

SKIP RULES
Skip a row (add to "skipped" array) ONLY if:
- The row is completely empty (all fields are empty strings, null, or whitespace)

When skipping, include:
{
  "original_row": { <all fields from CSV exactly as given> },
  "reason": "Row is completely empty",
  "row_number": <1-indexed row number>
}

DATA INTEGRITY RULES (CRITICAL)
1. NEVER invent, guess, or hallucinate data that is not present in the row
2. If a field is empty or missing, use empty string "" or null
3. Preserve exact spelling, capitalization, and formatting of text values
4. Preserve leading zeros in codes/SKUs (e.g., "00123" stays "00123", not 123)
5. Preserve all special characters and unicode correctly
6. If a cell contains multiple lines, preserve line breaks as literal \n characters

CSV SAFETY
- Replace internal newlines in cell values with the two literal characters "\\n"
- Do NOT escape commas or quotes (handled downstream)
- Ensure all string output is valid JSON

OUTPUT FORMAT
Return ONLY valid JSON matching the schema above. No markdown code fences, no prose,
no explanations, no leading or trailing text. Your entire response must be a single
parseable JSON object.
`;
```

**Key Improvements:**
- ✅ No domain-specific terminology
- ✅ Instructions for detecting any data type
- ✅ Clear normalization rules for dates, numbers, booleans
- ✅ Skip only completely empty rows
- ✅ Preserve all data exactly as provided
- ✅ Return detected schema for frontend use


### 4.3 AI Extractor Service Changes

**Modified Function Signatures** (`backend/src/services/aiExtractor.ts`):

```typescript
// ❌ OLD: Returns Partial<CrmRecord>[]
export async function extractCrmRecords(
  headers: string[],
  rows: RawCsvRow[]
): Promise<AiBatchResult>

// ✅ NEW: Returns UniversalRecord[]
export async function extractUniversalRecords(
  headers: string[],
  rows: RawCsvRow[]
): Promise<AiBatchResult>
```

**Implementation Changes:**

1. **Rename function**: `extractCrmRecords` → `extractUniversalRecords`
2. **Update prompt**: Replace `SYSTEM_PROMPT` with new universal prompt
3. **Update validation**: Expect `UniversalRecord` structure in response
4. **Add schema extraction**: Parse `detected_schema` from AI response
5. **Remove enum validation**: No CrmStatus or DataSource checks

**Error Handling Enhancements:**
```typescript
// Add schema validation to ensure AI returns expected structure
function validateAiResponse(parsed: unknown): AiBatchResult | null {
  if (!parsed || typeof parsed !== "object") return null;
  
  const obj = parsed as Record<string, unknown>;
  
  // Validate required arrays
  if (!Array.isArray(obj.imported) || !Array.isArray(obj.skipped)) {
    return null;
  }
  
  // Validate each imported record has _metadata
  for (const record of obj.imported) {
    if (typeof record !== "object" || !record._metadata) {
      console.warn("[aiExtractor] Record missing _metadata:", record);
      return null;
    }
  }
  
  return obj as AiBatchResult;
}
```

---

## 5. Validation Logic Refactoring

### 5.1 Current Validator Analysis

**Problems with Current Validator** (`backend/src/services/validator.ts`):

```typescript
// ❌ Requires email OR phone
if (!emailValid && !mobileValid) {
  return { skipped: { original_row: originalRow, reason: "No email or mobile number found" } };
}

// ❌ Validates CrmStatus enum
const crm_status = isValidCrmStatus(raw.crm_status) ? raw.crm_status : "";

// ❌ Validates DataSource enum
const data_source = isValidDataSource(raw.data_source) ? raw.data_source : "";

// ❌ Hardcoded field sanitization
const record: CrmRecord = {
  created_at,
  name: safeString(raw.name),
  email,
  // ... 12 more hardcoded fields
};
```


### 5.2 New Universal Validator

**Design Principles:**
1. **No Domain Rules**: Remove email/phone requirements
2. **Universal Sanitization**: Prevent CSV injection, XSS
3. **Preserve Data**: Don't modify values unless security risk
4. **Type Agnostic**: Handle any field structure

**New Validator Implementation** (`backend/src/services/validator.ts`):

```typescript
import { UniversalRecord, SkippedRecord, DetectedSchema } from "../types/universal";

/**
 * Sanitizes a value to prevent CSV injection attacks
 * Characters that can trigger formula execution: = + - @ \t \r
 */
function sanitizeCsvValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  
  if (typeof value === "number" || typeof value === "boolean") {
    return value; // Numbers and booleans are safe
  }
  
  const str = String(value);
  
  // Check for CSV injection patterns
  const dangerousChars = /^[=+\-@\t\r]/;
  if (dangerousChars.test(str)) {
    // Prefix with single quote to prevent formula execution
    return `'${str}`;
  }
  
  // Preserve original value
  return str;
}

/**
 * Validates that a record has all expected columns from schema
 */
function validateRecordCompleteness(
  record: Record<string, unknown>,
  schema: DetectedSchema
): boolean {
  for (const column of schema.columns) {
    if (!(column in record)) {
      console.warn(`[validator] Missing column "${column}" in record`);
      return false;
    }
  }
  return true;
}

/**
 * Validates and sanitizes a single universal record
 */
export function validateAndSanitizeRecord(
  raw: Record<string, unknown>,
  schema: DetectedSchema,
  originalRow: Record<string, unknown>,
  rowNumber: number
): { record: UniversalRecord } | { skipped: SkippedRecord } {
  
  // Check if row is completely empty
  const hasAnyValue = Object.values(raw).some(
    (val) => val !== null && val !== undefined && String(val).trim() !== ""
  );
  
  if (!hasAnyValue) {
    return {
      skipped: {
        original_row: originalRow,
        reason: "Row is completely empty",
        row_number: rowNumber,
      },
    };
  }
  
  // Validate record has all expected columns
  if (!validateRecordCompleteness(raw, schema)) {
    return {
      skipped: {
        original_row: originalRow,
        reason: "Record missing expected columns",
        row_number: rowNumber,
      },
    };
  }
  
  // Sanitize all values
  const sanitized: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "_metadata") {
      sanitized[key] = value; // Preserve metadata as-is
    } else {
      sanitized[key] = sanitizeCsvValue(value);
    }
  }
  
  // Ensure metadata exists
  if (!sanitized._metadata || typeof sanitized._metadata !== "object") {
    sanitized._metadata = {
      row_number: rowNumber,
      import_timestamp: new Date().toISOString(),
      field_types: {},
    };
  }
  
  return { record: sanitized as UniversalRecord };
}

/**
 * Validation summary for batch processing
 */
export interface ValidationSummary {
  imported: UniversalRecord[];
  skipped: SkippedRecord[];
}

/**
 * Validates AI output batch
 */
export function validateAiOutput(
  aiImported: UniversalRecord[],
  aiSkipped: SkippedRecord[],
  schema: DetectedSchema
): ValidationSummary {
  const imported: UniversalRecord[] = [];
  const skipped: SkippedRecord[] = [...aiSkipped];
  
  for (const raw of aiImported) {
    const rowNumber = raw._metadata?.row_number ?? 0;
    const originalRow = { ...raw };
    delete originalRow._metadata; // Remove metadata for original_row
    
    const result = validateAndSanitizeRecord(raw, schema, originalRow, rowNumber);
    
    if ("record" in result) {
      imported.push(result.record);
    } else {
      skipped.push(result.skipped);
    }
  }
  
  return { imported, skipped };
}
```

**Key Changes:**
- ✅ Remove email/phone validation
- ✅ Remove enum validation (CrmStatus, DataSource)
- ✅ Add CSV injection prevention
- ✅ Skip only completely empty rows
- ✅ Validate schema completeness
- ✅ Preserve all field types (string, number, boolean)


### 5.3 Security Considerations

**CSV Injection Prevention:**
```typescript
// Values starting with these characters can trigger Excel formulas:
// = + - @ \t \r

// Example attack: =1+1 in a cell would execute in Excel
// Mitigation: Prefix dangerous values with single quote: '=1+1
```

**XSS Prevention:**
```typescript
// Frontend must use proper escaping when rendering cell values
// React automatically escapes text content, but be cautious with:
// - dangerouslySetInnerHTML (never use with CSV data)
// - href attributes with user data (validate URLs)
// - event handlers with dynamic content
```

---

## 6. Frontend Changes

### 6.1 Type Updates

**File: `frontend/types/universal.ts`** (rename from `crm.ts`):

```typescript
// ✅ Import backend types
export type {
  UniversalRecord,
  RecordMetadata,
  DataType,
  DetectedSchema,
  SkippedRecord,
  ImportSuccessResponse,
  ImportErrorResponse,
  ImportResponse,
} from "../../../backend/src/types/universal";

/** UI states for upload flow */
export type UploadState = "idle" | "dragging" | "file_selected" | "error";

/** CSV preview before import */
export interface CsvPreview {
  columns: string[];
  rows: Record<string, string>[];
  totalRowCount: number;
}
```

### 6.2 ResultsTable Component Refactoring

**Current Component Issues:**
- Hardcoded `CRM_RECORD_FIELDS` for columns
- Hardcoded `FIELD_LABELS` mapping
- Special rendering for `crm_status` field
- Assumes exactly 15 columns

**New Dynamic ResultsTable** (`frontend/components/ResultsTable.tsx`):

```typescript
"use client";

import { UniversalRecord, DataType } from "../types/universal";

interface ResultsTableProps {
  records: UniversalRecord[];
}

/**
 * Formats a value based on its detected data type
 */
function formatValue(value: unknown, dataType: DataType): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  
  switch (dataType) {
    case "date":
      // Format ISO date to readable format
      try {
        const date = new Date(String(value));
        return date.toLocaleString();
      } catch {
        return String(value);
      }
    
    case "boolean":
      return value ? "✓" : "✗";
    
    case "currency":
      // Attempt to format as currency
      const num = typeof value === "number" ? value : parseFloat(String(value));
      if (!isNaN(num)) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD", // Default, should be detected from data
        }).format(num);
      }
      return String(value);
    
    case "percentage":
      const pct = typeof value === "number" ? value : parseFloat(String(value));
      if (!isNaN(pct)) {
        return `${(pct * 100).toFixed(2)}%`;
      }
      return String(value);
    
    case "url":
      return String(value); // Could be rendered as a link
    
    case "email":
      return String(value); // Could be rendered as mailto link
    
    default:
      return String(value);
  }
}

/**
 * Extracts column names from first record (excluding _metadata)
 */
function getColumns(records: UniversalRecord[]): string[] {
  if (records.length === 0) return [];
  
  const firstRecord = records[0];
  return Object.keys(firstRecord).filter((key) => key !== "_metadata");
}

export default function ResultsTable({ records }: ResultsTableProps) {
  if (records.length === 0) {
    return (
      <div
        className="glass rounded-xl px-5 py-8 text-center text-sm"
        style={{ color: "var(--muted)" }}
      >
        No records imported.
      </div>
    );
  }
  
  const columns = getColumns(records);
  
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        className="overflow-auto max-h-[500px] max-w-full"
        style={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="sticky top-0 z-10 text-left px-3 py-2.5 font-medium whitespace-nowrap"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontSize: "10px",
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => {
              const fieldTypes = record._metadata?.field_types ?? {};
              
              return (
                <tr
                  key={idx}
                  style={{
                    background: "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(200,169,110,0.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {columns.map((column) => {
                    const value = record[column];
                    const dataType = fieldTypes[column] ?? "string";
                    const formatted = formatValue(value, dataType);
                    
                    return (
                      <td
                        key={column}
                        className="px-3 py-2.5 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          color:
                            formatted === "—"
                              ? "rgba(255,255,255,0.18)"
                              : "var(--ink-soft)",
                        }}
                        title={String(value)} // Show full value on hover
                      >
                        {formatted}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Key Improvements:**
- ✅ Dynamic column extraction from records
- ✅ Type-aware value formatting
- ✅ No hardcoded field names
- ✅ Handles any number of columns
- ✅ Tooltip shows full value on hover


### 6.3 PreviewTable Component Refactoring

**New Dynamic PreviewTable** (`frontend/components/PreviewTable.tsx`):

```typescript
"use client";

import { CsvPreview } from "../types/universal";

interface PreviewTableProps {
  preview: CsvPreview;
}

export default function PreviewTable({ preview }: PreviewTableProps) {
  const { columns, rows, totalRowCount } = preview;
  
  if (rows.length === 0) {
    return (
      <div
        className="glass rounded-xl px-5 py-8 text-center text-sm"
        style={{ color: "var(--muted)" }}
      >
        No data to preview.
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: "var(--ink)" }}>
          CSV Preview
        </h3>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          Showing {rows.length} of {totalRowCount} rows
        </span>
      </div>
      
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div
          className="overflow-auto max-h-[300px] max-w-full"
          style={{
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="sticky top-0 z-10 text-left px-3 py-2.5 font-medium whitespace-nowrap"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--muted)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fontSize: "10px",
                    }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    background: "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(200,169,110,0.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {columns.map((column) => {
                    const value = row[column];
                    return (
                      <td
                        key={column}
                        className="px-3 py-2.5 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          color: value
                            ? "var(--ink-soft)"
                            : "rgba(255,255,255,0.18)",
                        }}
                        title={value} // Show full value on hover
                      >
                        {value || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

### 6.4 SkippedTable Component Updates

**New SkippedTable** (`frontend/components/SkippedTable.tsx`):

```typescript
"use client";

import { SkippedRecord } from "../types/universal";

interface SkippedTableProps {
  records: SkippedRecord[];
}

export default function SkippedTable({ records }: SkippedTableProps) {
  if (records.length === 0) {
    return null; // Don't show if no skipped records
  }
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium" style={{ color: "var(--ink)" }}>
        Skipped Rows ({records.length})
      </h3>
      
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div
          className="overflow-auto max-h-[300px] max-w-full"
          style={{
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr>
                <th
                  className="sticky top-0 z-10 text-left px-3 py-2.5 font-medium whitespace-nowrap"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontSize: "10px",
                  }}
                >
                  Row #
                </th>
                <th
                  className="sticky top-0 z-10 text-left px-3 py-2.5 font-medium whitespace-nowrap"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontSize: "10px",
                  }}
                >
                  Reason
                </th>
                <th
                  className="sticky top-0 z-10 text-left px-3 py-2.5 font-medium whitespace-nowrap"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontSize: "10px",
                  }}
                >
                  Original Data
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr
                  key={idx}
                  style={{
                    background: "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(248,113,113,0.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    className="px-3 py-2.5 whitespace-nowrap"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {record.row_number}
                  </td>
                  <td
                    className="px-3 py-2.5 whitespace-nowrap"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      color: "var(--danger)",
                    }}
                  >
                    {record.reason}
                  </td>
                  <td
                    className="px-3 py-2.5 max-w-[400px] overflow-hidden text-ellipsis"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      color: "var(--muted)",
                      fontFamily: "monospace",
                      fontSize: "10px",
                    }}
                    title={JSON.stringify(record.original_row)}
                  >
                    {JSON.stringify(record.original_row)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```


### 6.5 Label and Messaging Updates

**Files to Update:**
- `frontend/app/page.tsx` - Main page content
- `frontend/components/UploadZone.tsx` - Upload UI text
- `frontend/components/SummaryBar.tsx` - Summary labels

**Text Changes:**

| Component | Old Text | New Text |
|-----------|----------|----------|
| Page Title | "Import Leads Instantly" | "Import Any CSV Instantly" |
| Page Subtitle | "AI maps CRM fields automatically" | "AI maps every column automatically" |
| Upload Zone | "Drop CSV with leads here" | "Drop any CSV file here" |
| Upload Instructions | "Must contain email or phone" | "Supports any CSV structure" |
| Summary Bar | "Leads Imported" | "Records Imported" |
| Results Header | "Imported Leads" | "Imported Records" |
| Error Message | "Missing required CRM fields" | "Invalid CSV format detected" |

**Example Update in `page.tsx`:**

```typescript
// ❌ OLD
<h1>Import Leads Instantly</h1>
<p>AI-powered CRM lead importer for GrowEasy</p>

// ✅ NEW
<h1>Import Any CSV Instantly</h1>
<p>AI-powered universal CSV importer</p>
```

---

## 7. API Contract

### 7.1 Import Endpoint

**Endpoint:** `POST /api/import`

**Request:**
- **Content-Type:** `multipart/form-data`
- **Field:** `file` (CSV file, max 10 MB)

**Success Response (200):**
```json
{
  "success": true,
  "total_rows": 150,
  "total_imported": 148,
  "total_skipped": 2,
  "imported": [
    {
      "Product Name": "Widget A",
      "SKU": "WDG-001",
      "Price": 29.99,
      "In Stock": true,
      "_metadata": {
        "row_number": 1,
        "import_timestamp": "2024-01-15T10:30:00.000Z",
        "field_types": {
          "Product Name": "string",
          "SKU": "string",
          "Price": "currency",
          "In Stock": "boolean"
        }
      }
    }
    // ... more records
  ],
  "skipped": [
    {
      "original_row": { "Product Name": "", "SKU": "", "Price": "", "In Stock": "" },
      "reason": "Row is completely empty",
      "row_number": 75
    }
  ],
  "schema": {
    "columns": ["Product Name", "SKU", "Price", "In Stock"],
    "column_types": {
      "Product Name": "string",
      "SKU": "string",
      "Price": "currency",
      "In Stock": "boolean"
    },
    "sample_values": {
      "Product Name": ["Widget A", "Widget B", "Gadget X"],
      "SKU": ["WDG-001", "WDG-002", "GDG-100"],
      "Price": ["29.99", "39.99", "149.99"],
      "In Stock": ["true", "false", "true"]
    },
    "total_rows": 150
  }
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "INVALID_CSV",
  "message": "The uploaded file could not be parsed as a valid CSV.",
  "details": "Expected headers on first line, found binary data"
}
```

### 7.2 Error Codes

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `NO_FILE_UPLOADED` | 400 | No file in request | Upload a file |
| `INVALID_CSV` | 422 | File is not valid CSV | Check file format |
| `FILE_TOO_LARGE` | 400 | File exceeds 10 MB limit | Reduce file size or split |
| `EMPTY_CSV` | 422 | CSV has no data rows | Add data to CSV |
| `UNSUPPORTED_ENCODING` | 422 | CSV encoding not UTF-8 | Convert to UTF-8 |
| `AI_PROCESSING_FAILED` | 500 | AI service error | Retry or contact support |

---

## 8. Data Flow

### 8.1 Import Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User Uploads CSV File                                      │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Backend: Parse CSV                                         │
│    - Detect encoding (UTF-8 check)                            │
│    - Extract headers (first row)                              │
│    - Parse rows as key-value objects                          │
│    - Return: RawCsvRow[]                                      │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. AI Extractor: Process Batches                              │
│    - Split rows into batches (size: 10)                       │
│    - For each batch:                                          │
│      • Send to AI with universal prompt                       │
│      • AI analyzes headers and values                         │
│      • AI detects data types                                  │
│      • AI normalizes dates/numbers                            │
│      • AI returns UniversalRecord[]                           │
│    - Combine batch results                                    │
│    - Generate DetectedSchema                                  │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Validator: Sanitize and Validate                           │
│    - For each record:                                         │
│      • Check not completely empty                             │
│      • Validate schema completeness                           │
│      • Sanitize for CSV injection                             │
│      • Preserve metadata                                      │
│    - Return: imported[], skipped[]                            │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Response: Send to Frontend                                 │
│    - ImportSuccessResponse with:                              │
│      • imported: UniversalRecord[]                            │
│      • skipped: SkippedRecord[]                               │
│      • schema: DetectedSchema                                 │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Frontend: Render Results                                   │
│    - Extract columns from schema                              │
│    - Render dynamic table                                     │
│    - Format values by data type                               │
│    - Show skipped records if any                              │
└──────────────────────────────────────────────────────────────┘
```


### 8.2 Example: Processing Product Catalog CSV

**Input CSV:**
```csv
Product Name,SKU,Price,Category,In Stock,Last Updated
Widget A,WDG-001,29.99,Gadgets,Yes,2024-01-10
Widget B,WDG-002,39.99,Gadgets,No,2024-01-11
Gadget X,GDG-100,149.99,Electronics,Yes,2024-01-12
```

**Step 1: Parse CSV**
```typescript
headers = ["Product Name", "SKU", "Price", "Category", "In Stock", "Last Updated"]
rows = [
  { "Product Name": "Widget A", "SKU": "WDG-001", "Price": "29.99", ... },
  { "Product Name": "Widget B", "SKU": "WDG-002", "Price": "39.99", ... },
  { "Product Name": "Gadget X", "SKU": "GDG-100", "Price": "149.99", ... }
]
```

**Step 2: AI Processing**
AI receives prompt:
```
Analyze these CSV rows and detect data types:
Headers: ["Product Name", "SKU", "Price", "Category", "In Stock", "Last Updated"]
Rows: [{ "Product Name": "Widget A", "SKU": "WDG-001", "Price": "29.99", ... }, ...]
```

AI returns:
```json
{
  "imported": [
    {
      "Product Name": "Widget A",
      "SKU": "WDG-001",
      "Price": 29.99,
      "Category": "Gadgets",
      "In Stock": true,
      "Last Updated": "2024-01-10T00:00:00.000Z",
      "_metadata": {
        "row_number": 1,
        "import_timestamp": "2024-01-15T10:30:00.000Z",
        "field_types": {
          "Product Name": "string",
          "SKU": "string",
          "Price": "currency",
          "Category": "string",
          "In Stock": "boolean",
          "Last Updated": "date"
        }
      }
    }
    // ... more records
  ],
  "skipped": [],
  "detected_schema": {
    "columns": ["Product Name", "SKU", "Price", "Category", "In Stock", "Last Updated"],
    "column_types": {
      "Product Name": "string",
      "SKU": "string",
      "Price": "currency",
      "Category": "string",
      "In Stock": "boolean",
      "Last Updated": "date"
    },
    "sample_values": { /* ... */ },
    "total_rows": 3
  }
}
```

**Step 3: Validation**
- Check no records are completely empty ✓
- Sanitize for CSV injection ✓
- Validate schema completeness ✓

**Step 4: Frontend Rendering**
- Extract columns: `["Product Name", "SKU", "Price", "Category", "In Stock", "Last Updated"]`
- Render table with 6 columns
- Format "Price" as currency: "$29.99"
- Format "In Stock" as boolean: "✓" or "✗"
- Format "Last Updated" as date: "1/10/2024, 12:00:00 AM"

---

## 9. Migration Strategy

### 9.1 File Rename Plan

| Old Path | New Path | Reason |
|----------|----------|--------|
| `backend/src/types/crm.ts` | `backend/src/types/universal.ts` | Remove CRM terminology |
| `backend/src/constants/crm.ts` | `backend/src/constants/config.ts` | Generic config naming |
| `frontend/types/crm.ts` | `frontend/types/universal.ts` | Align with backend |

### 9.2 Implementation Order

**Phase 1: Backend Type System (No Breaking Changes)**
1. Create `backend/src/types/universal.ts` with new types
2. Create `backend/src/constants/config.ts` without CRM-specific constants
3. Update imports but keep `crm.ts` files temporarily for compatibility

**Phase 2: Backend Logic Refactoring**
4. Update AI prompt in `aiExtractor.ts` to universal version
5. Rename `extractCrmRecords` → `extractUniversalRecords`
6. Refactor `validator.ts` to use universal validation
7. Update `import.ts` route to use new types
8. Run backend tests with CRM test CSVs to verify backward compatibility

**Phase 3: Frontend Refactoring**
9. Create `frontend/types/universal.ts`
10. Update `ResultsTable.tsx` for dynamic rendering
11. Update `PreviewTable.tsx` for dynamic columns
12. Update `SkippedTable.tsx` with row numbers
13. Update all labels and messaging
14. Update `useCSVImport.ts` hook for new response types

**Phase 4: Cleanup**
15. Delete `backend/src/types/crm.ts`
16. Delete `backend/src/constants/crm.ts`
17. Delete `frontend/types/crm.ts`
18. Update all remaining imports

**Phase 5: Testing**
19. Test with CRM CSVs (facebook.csv, google_ads.csv, broker.csv)
20. Test with new CSV types (currency.csv, products.csv, sales.csv)
21. Test edge cases (empty rows, single column, 50 columns, special characters)
22. Performance testing with large files (10 MB limit)


### 9.3 Backward Compatibility Testing

**Test Case 1: Facebook Leads CSV**
```csv
Full Name,Email,Phone Number,Campaign
John Doe,john@example.com,+1234567890,Summer Campaign
Jane Smith,jane@example.com,,Winter Campaign
```

**Expected Behavior:**
- AI detects "Full Name" → maps to dynamic field "Full Name"
- AI detects "Email" → type: "email"
- AI detects "Phone Number" → type: "phone"
- Both rows imported successfully (no email/phone requirement)
- Result: 100% import rate (vs. current system that might skip Jane Smith)

**Test Case 2: Google Ads CSV**
```csv
Name,Country Code,Mobile,Email,Created Date,Status
Lead A,+91,9876543210,leada@example.com,05/13/2026,Hot Lead
Lead B,+1,5551234567,leadb@example.com,05/14/2026,Cold Lead
```

**Expected Behavior:**
- AI detects all columns dynamically
- AI normalizes "Created Date" to ISO 8601
- AI maps "Status" to "Status" field (no longer requires CrmStatus enum)
- Result: 100% import rate with preserved data

---

## 10. Edge Cases and Error Handling

### 10.1 Edge Case Scenarios

**Scenario 1: CSV with 50+ Columns**
```csv
Col1,Col2,Col3,...,Col50
Val1,Val2,Val3,...,Val50
```
- **Handling**: Frontend renders with horizontal scroll
- **AI**: Processes all columns without truncation
- **Validation**: Ensures all 50 columns present in each record

**Scenario 2: CSV with Only 1 Column**
```csv
Email
john@example.com
jane@example.com
```
- **Handling**: Single-column table rendered correctly
- **AI**: Detects "Email" column, type: "email"
- **Result**: All rows imported

**Scenario 3: CSV with Special Characters**
```csv
Name,Description
"Widget ""Pro""","Includes: A, B, C"
Gadget X,"=SUM(1+1)"
```
- **Handling**: CSV parser handles quotes correctly
- **Validation**: Sanitizes `=SUM(1+1)` to `'=SUM(1+1)` (prevents formula injection)
- **Result**: Data preserved safely

**Scenario 4: CSV with Completely Empty Rows**
```csv
Name,Email,Phone
John,john@example.com,1234567890
,,,
Jane,jane@example.com,9876543210
```
- **Handling**: Middle row skipped (all fields empty)
- **Reason**: "Row is completely empty"
- **Result**: 2 imported, 1 skipped

**Scenario 5: CSV with Non-UTF-8 Encoding**
```csv
Name,Email
José,jose@example.com  # UTF-8
```
- **Handling**: CSV parser detects encoding, converts to UTF-8
- **Fallback**: If conversion fails, return `UNSUPPORTED_ENCODING` error
- **User Action**: Convert file to UTF-8 before upload

**Scenario 6: CSV with Mixed Date Formats**
```csv
Date,Event
2024-01-15,Launch
01/16/2024,Meeting
Jan 17 2024,Review
```
- **Handling**: AI normalizes all to ISO 8601
- **Result**: All dates converted to `YYYY-MM-DDTHH:mm:ss.sssZ` format

**Scenario 7: CSV with Leading Zeros in SKUs**
```csv
SKU,Product
00123,Widget
00456,Gadget
```
- **Handling**: AI preserves "00123" as string (not converted to number 123)
- **Validation**: Ensures leading zeros maintained
- **Result**: SKUs rendered correctly as "00123"

### 10.2 Error Response Examples

**Invalid CSV Structure:**
```json
{
  "success": false,
  "error": "INVALID_CSV",
  "message": "The uploaded file could not be parsed as a valid CSV.",
  "details": "Row 15 has 5 columns but header has 4 columns"
}
```

**File Too Large:**
```json
{
  "success": false,
  "error": "FILE_TOO_LARGE",
  "message": "File exceeds the maximum allowed size of 10 MB.",
  "details": "File size: 12.5 MB"
}
```

**AI Processing Failed:**
```json
{
  "success": false,
  "error": "AI_PROCESSING_FAILED",
  "message": "The AI extraction step failed. Please try again.",
  "details": "Rate limit exceeded, retry after 30 seconds"
}
```

---

## 11. Performance Considerations

### 11.1 Batch Processing

**Current Configuration:**
- Batch size: 10 rows per AI request
- Sequential processing (to respect rate limits)
- Max retry attempts: 6
- Exponential backoff: [0, 1000, 2000, 4000, 8000, 12000] ms

**Optimization Opportunities:**

1. **Adaptive Batch Sizing**
   - For CSVs with many columns (>20), reduce batch size to 5
   - For CSVs with few columns (<10), increase batch size to 20
   - Formula: `batch_size = Math.max(5, Math.min(20, 150 / column_count))`

2. **Parallel Processing for Multiple Files**
   - If user uploads multiple CSVs, process in parallel
   - Requires frontend enhancement to support multi-file upload

3. **Caching for Identical CSVs**
   - Hash CSV content, cache import results for 1 hour
   - If same file uploaded again, return cached results
   - Saves AI API costs and processing time

### 11.2 Memory Management

**Large File Handling:**
- Max file size: 10 MB (configurable in `config.ts`)
- Estimated max rows: ~50,000 rows (for 10 MB CSV)
- Memory footprint: ~3x file size during processing

**Streaming Consideration (Future Enhancement):**
- For files >10 MB, implement streaming CSV parser
- Process rows in chunks without loading entire file into memory
- Requires architectural change: stream → process → stream response

### 11.3 Frontend Performance

**Dynamic Table Rendering:**
- Use virtualization for tables with >1000 rows
- Library recommendation: `react-window` or `@tanstack/react-virtual`
- Only render visible rows (improves initial load time)

**Large Column Count Handling:**
- For CSVs with >30 columns, consider column grouping
- Add "Show/Hide Columns" feature to toggle visibility
- Persist column preferences in localStorage

---

## 12. Testing Strategy

### 12.1 Unit Tests

**Backend Unit Tests:**

```typescript
// backend/src/services/__tests__/validator.test.ts
describe("validateAndSanitizeRecord", () => {
  it("should preserve all fields from schema", () => {
    const record = { Name: "John", Email: "john@example.com" };
    const schema = { columns: ["Name", "Email"], /* ... */ };
    const result = validateAndSanitizeRecord(record, schema, record, 1);
    expect(result.record.Name).toBe("John");
    expect(result.record.Email).toBe("john@example.com");
  });

  it("should sanitize CSV injection attempts", () => {
    const record = { Formula: "=SUM(1+1)" };
    const schema = { columns: ["Formula"], /* ... */ };
    const result = validateAndSanitizeRecord(record, schema, record, 1);
    expect(result.record.Formula).toBe("'=SUM(1+1)");
  });

  it("should skip completely empty rows", () => {
    const record = { Name: "", Email: "" };
    const schema = { columns: ["Name", "Email"], /* ... */ };
    const result = validateAndSanitizeRecord(record, schema, record, 1);
    expect(result.skipped).toBeDefined();
    expect(result.skipped.reason).toBe("Row is completely empty");
  });
});
```

**AI Extractor Unit Tests:**

```typescript
// backend/src/services/__tests__/aiExtractor.test.ts
describe("extractUniversalRecords", () => {
  it("should process product catalog CSV", async () => {
    const headers = ["Product Name", "SKU", "Price"];
    const rows = [
      { "Product Name": "Widget", "SKU": "WDG-001", "Price": "29.99" }
    ];
    const result = await extractUniversalRecords(headers, rows);
    expect(result.imported).toHaveLength(1);
    expect(result.imported[0]["Product Name"]).toBe("Widget");
  });
});
```

### 12.2 Integration Tests

**Full Import Flow Test:**

```typescript
// backend/src/__tests__/import.integration.test.ts
describe("POST /api/import", () => {
  it("should import currency CSV successfully", async () => {
    const csvBuffer = Buffer.from("Code,Symbol,Name\nUSD,$,US Dollar\nEUR,€,Euro");
    const response = await request(app)
      .post("/api/import")
      .attach("file", csvBuffer, "currency.csv");
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.total_imported).toBe(2);
    expect(response.body.imported[0].Code).toBe("USD");
  });
});
```

### 12.3 End-to-End Tests

**Playwright E2E Test:**

```typescript
// e2e/import.spec.ts
test("should import product catalog and display results", async ({ page }) => {
  await page.goto("/");
  
  // Upload CSV
  await page.setInputFiles('input[type="file"]', "test-csvs/products.csv");
  
  // Wait for processing
  await page.waitForSelector('[data-testid="results-table"]');
  
  // Verify columns rendered
  const headers = await page.locator("th").allTextContents();
  expect(headers).toContain("Product Name");
  expect(headers).toContain("SKU");
  expect(headers).toContain("Price");
  
  // Verify data rendered
  const firstCell = await page.locator("tbody tr:first-child td:first-child").textContent();
  expect(firstCell).toBeTruthy();
});
```

### 12.4 Test CSV Files

**Create Test Suite:**
```
test-csvs/
├── crm/
│   ├── facebook.csv       # Existing CRM test
│   ├── google_ads.csv     # Existing CRM test
│   └── broker.csv         # Existing CRM test
├── universal/
│   ├── currency.csv       # Code, Symbol, Name
│   ├── products.csv       # Product Name, SKU, Price, In Stock
│   ├── sales.csv          # Date, Customer, Amount, Status
│   ├── inventory.csv      # Item, Quantity, Location, Last Updated
│   └── employees.csv      # Name, Department, Hire Date, Salary
├── edge-cases/
│   ├── single-column.csv  # Just email addresses
│   ├── many-columns.csv   # 50 columns
│   ├── empty-rows.csv     # Contains empty rows
│   ├── special-chars.csv  # Unicode, quotes, commas
│   └── mixed-dates.csv    # Various date formats
```


---

## 13. Configuration Changes

### 13.1 Backend Configuration

**New File: `backend/src/constants/config.ts`** (replaces `crm.ts`):

```typescript
/**
 * CSV Processing Configuration
 */

// Batch size for AI processing (rows per request)
export const BATCH_SIZE = 10;

// Maximum file size in bytes (10 MB)
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// AI retry configuration
export const MAX_RETRY_ATTEMPTS = 6;
export const RETRY_DELAYS_MS = [0, 1000, 2000, 4000, 8000, 12000];

// Accepted MIME types for CSV uploads
export const ACCEPTED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "text/plain",
  "application/csv", // Add additional CSV MIME type
];

// CSV parser options
export const CSV_PARSER_OPTIONS = {
  skipEmptyLines: true,
  trim: true,
  delimiter: ",", // Can be auto-detected
};

// Data type detection patterns (for validation)
export const DATA_TYPE_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-()]{7,20}$/,
  url: /^https?:\/\/.+/,
  date: /^\d{4}-\d{2}-\d{2}/, // ISO 8601 date prefix
  currency: /^[$€£¥₹]\s*[\d,.]+$/,
  percentage: /^[\d.]+%$/,
};

// CSV injection prevention pattern
export const CSV_INJECTION_PATTERN = /^[=+\-@\t\r]/;
```

### 13.2 Environment Variables

**Update `.env.example`:**

```bash
# AI Service Configuration
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_MODEL=openai/gpt-oss-120b

# Server Configuration
PORT=3001
NODE_ENV=development

# CSV Processing Limits
MAX_FILE_SIZE_MB=10
BATCH_SIZE=10
MAX_RETRY_ATTEMPTS=6

# Feature Flags (for gradual rollout)
ENABLE_UNIVERSAL_IMPORTER=true
ENABLE_SCHEMA_DETECTION=true
ENABLE_TYPE_INFERENCE=true
```

### 13.3 Feature Flags

**Implement Gradual Rollout:**

```typescript
// backend/src/config/features.ts
export const featureFlags = {
  // Enable universal importer (false = use legacy CRM mode)
  universalImporter: process.env.ENABLE_UNIVERSAL_IMPORTER === "true",
  
  // Enable schema detection in AI prompt
  schemaDetection: process.env.ENABLE_SCHEMA_DETECTION === "true",
  
  // Enable advanced type inference
  typeInference: process.env.ENABLE_TYPE_INFERENCE === "true",
};

// Usage in aiExtractor.ts
if (featureFlags.universalImporter) {
  return extractUniversalRecords(headers, rows);
} else {
  return extractCrmRecords(headers, rows); // Legacy fallback
}
```

**Rollout Strategy:**
1. **Week 1**: Deploy with `ENABLE_UNIVERSAL_IMPORTER=false` (no changes visible)
2. **Week 2**: Enable for internal testing team only
3. **Week 3**: Enable for 10% of users (A/B test)
4. **Week 4**: Enable for 50% of users
5. **Week 5**: Enable for 100% of users
6. **Week 6**: Remove feature flags and legacy code

---

## 14. Monitoring and Observability

### 14.1 Logging Strategy

**Add Structured Logging:**

```typescript
// backend/src/utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "import.log" }),
  ],
});

// Usage in import flow
logger.info("CSV import started", {
  filename: file.originalname,
  fileSize: file.size,
  rowCount: rows.length,
  columnCount: headers.length,
});

logger.info("AI processing complete", {
  totalRows: rows.length,
  imported: imported.length,
  skipped: skipped.length,
  processingTimeMs: Date.now() - startTime,
});
```

### 14.2 Metrics to Track

**Key Performance Indicators:**

1. **Import Success Rate**
   - Metric: `imported / total_rows`
   - Target: >95% for all CSV types

2. **Processing Time**
   - Metric: Time from upload to response
   - Target: <30 seconds for 1000 rows

3. **AI API Costs**
   - Metric: Total API calls and token usage
   - Target: <$0.01 per 100 rows

4. **Error Rates**
   - Metric: Percentage of failed imports by error code
   - Target: <5% overall error rate

5. **CSV Type Distribution**
   - Metric: Count of imports by detected schema
   - Use: Understand usage patterns

**Metrics Collection:**

```typescript
// backend/src/middleware/metrics.ts
import { Counter, Histogram } from "prom-client";

export const importCounter = new Counter({
  name: "csv_imports_total",
  help: "Total number of CSV imports",
  labelNames: ["status", "error_code"],
});

export const importDuration = new Histogram({
  name: "csv_import_duration_seconds",
  help: "Duration of CSV imports",
  buckets: [1, 5, 10, 30, 60, 120],
});

export const rowsProcessed = new Histogram({
  name: "csv_rows_processed",
  help: "Number of rows processed per import",
  buckets: [10, 50, 100, 500, 1000, 5000],
});
```

### 14.3 Alerting Rules

**Set Up Alerts:**

1. **High Error Rate**
   - Condition: Error rate >10% over 5 minutes
   - Action: Notify on-call engineer

2. **Slow Processing**
   - Condition: P95 processing time >60 seconds
   - Action: Investigate AI API performance

3. **High AI Costs**
   - Condition: Daily AI costs >$50
   - Action: Review usage patterns, optimize batch size

---

## 15. Documentation Updates

### 15.1 README Updates

**Add Universal CSV Section:**

```markdown
# GrowEasy Universal CSV Importer

## What's New: Universal Import

The importer now supports **any CSV file type**, not just CRM leads. Upload product catalogs, financial data, inventory lists, currency tables, sales reports, and more.

### Supported CSV Types

- ✅ CRM leads (backward compatible)
- ✅ Product catalogs
- ✅ Financial transactions
- ✅ Inventory lists
- ✅ Currency/exchange rate tables
- ✅ Sales reports
- ✅ Employee records
- ✅ Any custom CSV structure

### Features

- **Dynamic Schema Detection**: AI automatically detects column types
- **Zero Configuration**: No manual field mapping required
- **Type-Aware Rendering**: Dates, currencies, booleans formatted correctly
- **High Import Rate**: Processes all rows except completely empty ones
- **CSV Injection Protection**: Automatic sanitization for security

### Example CSVs

See `test-csvs/` directory for example files:
- `test-csvs/currency.csv` - Currency codes and symbols
- `test-csvs/products.csv` - Product catalog with SKUs
- `test-csvs/sales.csv` - Sales transactions
```

### 15.2 API Documentation

**Create OpenAPI Spec:**

```yaml
openapi: 3.0.0
info:
  title: Universal CSV Importer API
  version: 2.0.0
  description: AI-powered CSV import API that handles any CSV structure

paths:
  /api/import:
    post:
      summary: Import CSV file
      description: Upload a CSV file and receive structured records with detected schema
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                  description: CSV file (max 10 MB)
      responses:
        200:
          description: Import successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ImportSuccessResponse'
        400:
          description: Bad request (no file, file too large)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ImportErrorResponse'
        422:
          description: Invalid CSV format
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ImportErrorResponse'
        500:
          description: Server error (AI processing failed)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ImportErrorResponse'

components:
  schemas:
    UniversalRecord:
      type: object
      description: Dynamic record with fields from CSV columns
      properties:
        _metadata:
          $ref: '#/components/schemas/RecordMetadata'
      additionalProperties: true
      
    RecordMetadata:
      type: object
      properties:
        row_number:
          type: integer
          description: 1-indexed row number from CSV
        import_timestamp:
          type: string
          format: date-time
          description: ISO 8601 timestamp of import
        field_types:
          type: object
          additionalProperties:
            type: string
            enum: [string, number, boolean, date, email, phone, url, currency, percentage, unknown]
    
    ImportSuccessResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        total_rows:
          type: integer
        total_imported:
          type: integer
        total_skipped:
          type: integer
        imported:
          type: array
          items:
            $ref: '#/components/schemas/UniversalRecord'
        skipped:
          type: array
          items:
            $ref: '#/components/schemas/SkippedRecord'
        schema:
          $ref: '#/components/schemas/DetectedSchema'
    
    ImportErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
          enum: [NO_FILE_UPLOADED, INVALID_CSV, AI_PROCESSING_FAILED, FILE_TOO_LARGE, EMPTY_CSV, UNSUPPORTED_ENCODING]
        message:
          type: string
        details:
          type: string
```

---

## 16. Rollback Plan

### 16.1 Rollback Triggers

**Rollback Conditions:**
1. Error rate >15% for more than 10 minutes
2. Import success rate <80% for CRM test files
3. P95 processing time >2x baseline
4. Critical bug affecting data integrity

### 16.2 Rollback Procedure

**Step 1: Enable Legacy Mode**
```bash
# Set environment variable
ENABLE_UNIVERSAL_IMPORTER=false

# Restart backend
pm2 restart groweasy-backend
```

**Step 2: Revert Code (if needed)**
```bash
# Checkout previous stable release
git checkout v1.5.0

# Reinstall dependencies
cd backend && npm install
cd frontend && npm install

# Rebuild and deploy
npm run build
pm2 restart all
```

**Step 3: Verify Rollback**
- Test with CRM CSV files
- Verify import success rates return to baseline
- Check error logs for residual issues

### 16.3 Post-Rollback Actions

1. **Analyze Root Cause**: Review logs, metrics, user reports
2. **Fix Issues**: Address bugs in development environment
3. **Re-Test**: Comprehensive testing with diverse CSV types
4. **Gradual Re-Deployment**: Use feature flags for controlled rollout

---

## 17. Future Enhancements

### 17.1 Advanced Features (Post-Launch)

1. **Column Mapping UI**
   - Allow users to manually override AI-detected types
   - Drag-and-drop column reordering
   - Save mapping templates for repeated imports

2. **Data Transformation Rules**
   - User-defined formulas (e.g., "Price * 1.1" for markup)
   - Conditional formatting (e.g., "If Stock < 10, mark as Low")
   - Data cleaning rules (trim, uppercase, etc.)

3. **Scheduled Imports**
   - Recurring imports from URL or cloud storage
   - Email notifications on completion
   - Version history and diff tracking

4. **Export Functionality**
   - Export imported records as CSV, Excel, JSON
   - Filtered exports (e.g., only records with errors)
   - Bulk operations (merge, deduplicate)

5. **Collaboration Features**
   - Share import sessions with team members
   - Comments and annotations on specific rows
   - Approval workflow for critical imports

### 17.2 Technical Improvements

1. **Streaming Architecture**
   - Process files >10 MB without memory limits
   - Real-time progress updates during import
   - Incremental result rendering

2. **Multi-Language AI Prompts**
   - Detect CSV language (English, Spanish, French, etc.)
   - Localized prompt variations for better accuracy
   - Unicode and non-Latin character support

3. **Machine Learning Enhancements**
   - Train custom model on organization's CSV patterns
   - Learn from user corrections to improve accuracy
   - Confidence scoring for ambiguous fields

4. **Performance Optimizations**
   - Parallel batch processing (when rate limits allow)
   - Result caching with Redis
   - CDN integration for faster file uploads

---

## 18. Success Criteria

### 18.1 Technical Success Metrics

✅ **Type Safety**: Zero TypeScript errors after refactoring  
✅ **Test Coverage**: >80% code coverage for new universal logic  
✅ **Performance**: Import time <30s for 1000-row CSV  
✅ **Backward Compatibility**: 100% success rate on existing CRM test files  
✅ **Universal Compatibility**: >95% import rate on 10 diverse CSV types  

### 18.2 User Success Metrics

✅ **Adoption**: 50% of imports use non-CRM CSV types within 1 month  
✅ **Satisfaction**: User satisfaction score >4.5/5 on import feature  
✅ **Error Rate**: <5% of imports result in errors  
✅ **Support Tickets**: <10 support tickets related to import issues per month  

### 18.3 Business Success Metrics

✅ **Feature Expansion**: Enables new use cases beyond CRM  
✅ **Cost Efficiency**: AI API costs remain <$100/month  
✅ **Competitive Advantage**: Unique universal CSV import capability  
✅ **User Retention**: Improved retention due to expanded functionality  

---

## 19. Conclusion

This design document provides a comprehensive technical blueprint for transforming the GrowEasy CSV Importer from a CRM-specific tool into a universal CSV importer. The transformation involves:

1. **Type System Refactoring**: Replace hardcoded `CrmRecord` with dynamic `UniversalRecord`
2. **AI Prompt Redesign**: Generic, domain-agnostic prompt for any CSV type
3. **Validation Overhaul**: Universal sanitization without domain-specific rules
4. **Frontend Adaptation**: Dynamic table rendering for any column structure
5. **Backward Compatibility**: Maintain support for existing CRM workflows

The implementation follows a phased approach with feature flags, comprehensive testing, and rollback capabilities. The design prioritizes data integrity, security, and user experience while enabling the system to handle any CSV type without configuration.

**Next Steps:**
1. Review and approval of this design document
2. Break down into implementation tasks (see tasks.md)
3. Begin Phase 1: Backend type system refactoring
4. Iterative development with continuous testing
5. Gradual rollout using feature flags

**Estimated Timeline:**
- Design Review: 1 week
- Implementation: 3-4 weeks
- Testing: 1-2 weeks
- Gradual Rollout: 1 week
- **Total: 6-8 weeks**

---

## Appendix A: Type Definition Reference

**Complete Type Hierarchy:**

```
UniversalRecord
├── [key: string]: string | number | boolean | null
└── _metadata: RecordMetadata
    ├── row_number: number
    ├── import_timestamp: string
    ├── field_types: Record<string, DataType>
    └── confidence_scores?: Record<string, number>

DetectedSchema
├── columns: string[]
├── column_types: Record<string, DataType>
├── sample_values: Record<string, string[]>
└── total_rows: number

SkippedRecord
├── original_row: Record<string, unknown>
├── reason: string
└── row_number: number

ImportResponse
├── ImportSuccessResponse
│   ├── success: true
│   ├── total_rows: number
│   ├── total_imported: number
│   ├── total_skipped: number
│   ├── imported: UniversalRecord[]
│   ├── skipped: SkippedRecord[]
│   └── schema: DetectedSchema
└── ImportErrorResponse
    ├── success: false
    ├── error: ImportErrorCode
    ├── message: string
    └── details?: string
```

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**Author:** Design Team  
**Status:** Ready for Implementation
