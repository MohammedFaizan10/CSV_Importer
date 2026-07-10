/**
 * Universal CSV Importer Type Definitions
 *
 * These types replace the CRM-specific types (CrmRecord, CrmStatus, DataSource)
 * with flexible, domain-agnostic interfaces that support any CSV structure.
 */

// ─────────────────────────────────────────────
// Core Record Types
// ─────────────────────────────────────────────

/**
 * UniversalRecord represents a single row from any CSV file.
 * Fields are dynamically determined from CSV headers.
 *
 * The `_metadata` field is prefixed with underscore to avoid
 * conflicts with CSV columns that might be named "metadata".
 */
export interface UniversalRecord {
  /** Dynamic fields from CSV columns */
  [key: string]: string | number | boolean | null | RecordMetadata;

  /** Metadata fields (prefixed with underscore to avoid column conflicts) */
  _metadata: RecordMetadata;
}

/**
 * Metadata tracked for every imported record.
 * Provides provenance and type information without polluting data fields.
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

// ─────────────────────────────────────────────
// Data Type Classification
// ─────────────────────────────────────────────

/**
 * Data type classifications for CSV field values.
 * Used by the AI extractor to tag each field and by the frontend
 * for type-aware rendering (e.g., formatting dates, currency).
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

// ─────────────────────────────────────────────
// Schema Detection
// ─────────────────────────────────────────────

/**
 * Schema definition detected from CSV content.
 * Returned by the AI extractor alongside processed records
 * and used by the frontend for dynamic column rendering.
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

// ─────────────────────────────────────────────
// Skipped Records
// ─────────────────────────────────────────────

/**
 * Record that was skipped during import.
 * In the universal importer, rows are only skipped if completely empty.
 */
export interface SkippedRecord {
  /** Original row data exactly as it appeared in CSV */
  original_row: Record<string, unknown>;

  /** Human-readable reason for skipping */
  reason: string;

  /** Row number in original CSV (1-indexed) */
  row_number: number;
}

// ─────────────────────────────────────────────
// Raw CSV Types
// ─────────────────────────────────────────────

/** Raw row as parsed from CSV, keyed by whatever headers exist in the file. */
export type RawCsvRow = Record<string, string>;

// ─────────────────────────────────────────────
// AI Processing Types
// ─────────────────────────────────────────────

/**
 * Result from AI batch processing.
 * Contains processed records, skipped records, and the detected schema.
 */
export interface AiBatchResult {
  /** Successfully processed records */
  imported: UniversalRecord[];

  /** Records that could not be processed */
  skipped: SkippedRecord[];

  /** Detected schema from this batch */
  detected_schema?: DetectedSchema;
}

// ─────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────

/**
 * Successful import response.
 * Now includes the detected schema for frontend dynamic rendering.
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
 * Error codes for import failures.
 * Extended with EMPTY_CSV and UNSUPPORTED_ENCODING for better diagnostics.
 */
export type ImportErrorCode =
  | "NO_FILE_UPLOADED"
  | "INVALID_CSV"
  | "AI_PROCESSING_FAILED"
  | "FILE_TOO_LARGE"
  | "EMPTY_CSV"
  | "UNSUPPORTED_ENCODING";

/**
 * Error response for failed imports.
 * Includes an optional `details` field for technical debugging info.
 */
export interface ImportErrorResponse {
  success: false;
  error: ImportErrorCode;
  message: string;

  /** Optional technical details for debugging */
  details?: string;
}

/**
 * Union type for all import responses.
 */
export type ImportResponse = ImportSuccessResponse | ImportErrorResponse;
