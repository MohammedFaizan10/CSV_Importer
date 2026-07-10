/**
 * Universal CSV Importer — Frontend Type Definitions
 *
 * These types mirror the backend universal types for use in React components.
 * Since the frontend (Next.js) and backend are separate packages, we duplicate
 * the type definitions here rather than cross-project imports.
 */

// ─────────────────────────────────────────────
// Core Record Types
// ─────────────────────────────────────────────

/**
 * UniversalRecord represents a single row from any CSV file.
 * Fields are dynamically determined from CSV headers.
 */
export interface UniversalRecord {
  /** Dynamic fields from CSV columns */
  [key: string]: string | number | boolean | null | RecordMetadata;

  /** Metadata fields (prefixed with underscore to avoid column conflicts) */
  _metadata: RecordMetadata;
}

/**
 * Metadata tracked for every imported record.
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
// API Response Types
// ─────────────────────────────────────────────

/**
 * Successful import response from the backend API.
 */
export interface ImportSuccessResponse {
  success: true;
  total_rows: number;
  total_imported: number;
  total_skipped: number;
  imported: UniversalRecord[];
  skipped: SkippedRecord[];
  schema: DetectedSchema;
}

/**
 * Error response from the backend API.
 */
export interface ImportErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: string;
}

/**
 * Union type for all import responses.
 */
export type ImportResponse = ImportSuccessResponse | ImportErrorResponse;

// ─────────────────────────────────────────────
// Frontend-Specific Types
// ─────────────────────────────────────────────

/** UI states for the upload flow. */
export type UploadState = "idle" | "dragging" | "file_selected" | "error";

/** CSV preview before import (generated client-side from PapaParse). */
export interface CsvPreview {
  columns: string[];
  rows: Record<string, string>[];
  totalRowCount: number;
}
