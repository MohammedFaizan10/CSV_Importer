/**
 * Universal configuration constants.
 * Renamed from crm.ts — CRM-specific constants (CRM_STATUS_VALUES,
 * DATA_SOURCE_VALUES, CRM_RECORD_FIELDS, isValidCrmStatus, isValidDataSource)
 * have been removed as part of the universal CSV importer refactor.
 */

/** Number of CSV rows to send to the AI in each batch request. */
export const BATCH_SIZE = 10;

/** Maximum upload file size in bytes (10 MB). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum number of retry attempts for AI API calls. */
export const MAX_RETRY_ATTEMPTS = 6;

/** Progressive delay schedule (ms) between AI API retries. */
export const RETRY_DELAYS_MS = [0, 1000, 2000, 4000, 8000, 12000];

/** MIME types accepted at the multer level (relaxed — we rely on CSV parsing). */
export const ACCEPTED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "text/plain",
];
