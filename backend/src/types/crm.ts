/**
 * @deprecated — THIS FILE IS DEPRECATED AND WILL BE REMOVED.
 *
 * Migration guide:
 * ────────────────
 *   CrmRecord        → UniversalRecord  (from './universal.ts')
 *   CrmStatus        → removed (no fixed status enums in universal model)
 *   DataSource       → removed (no fixed data source enums in universal model)
 *   SkippedRecord    → SkippedRecord     (from './universal.ts', now includes row_number)
 *   RawCsvRow        → RawCsvRow         (from './universal.ts', unchanged)
 *   AiBatchResult    → AiBatchResult     (from './universal.ts', now includes detected_schema)
 *   ImportSuccess... → ImportSuccessResponse (from './universal.ts', now includes schema)
 *   ImportError...   → ImportErrorResponse   (from './universal.ts', unchanged)
 *
 * All active code now imports from './universal.ts'.
 * This file is retained only for reference during the migration period.
 */

/** @deprecated Use UniversalRecord from './universal.ts' */
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
  crm_status: CrmStatus | "";
  crm_note: string;
  data_source: DataSource | "";
  possession_time: string;
  description: string;
}

/** @deprecated Removed in universal model — no fixed status enums */
export type CrmStatus =
  | "GOOD_LEAD_FOLLOW_UP"
  | "DID_NOT_CONNECT"
  | "BAD_LEAD"
  | "SALE_DONE";

/** @deprecated Removed in universal model — no fixed data source enums */
export type DataSource =
  | "leads_on_demand"
  | "meridian_tower"
  | "eden_park"
  | "varah_swamy"
  | "sarjapur_plots";

/** @deprecated Use SkippedRecord from './universal.ts' (now includes row_number) */
export interface SkippedRecord {
  original_row: Record<string, unknown>;
  reason: string;
}

/** @deprecated Use RawCsvRow from './universal.ts' */
export type RawCsvRow = Record<string, string>;

/** @deprecated Use AiBatchResult from './universal.ts' (now includes detected_schema) */
export interface AiBatchResult {
  imported: Partial<CrmRecord>[];
  skipped: SkippedRecord[];
}

/** @deprecated Use ImportSuccessResponse from './universal.ts' (now includes schema) */
export interface ImportSuccessResponse {
  success: true;
  total_rows: number;
  total_imported: number;
  total_skipped: number;
  imported: CrmRecord[];
  skipped: SkippedRecord[];
}

/** @deprecated Use ImportErrorResponse from './universal.ts' */
export type ImportErrorCode =
  | "NO_FILE_UPLOADED"
  | "INVALID_CSV"
  | "AI_PROCESSING_FAILED"
  | "FILE_TOO_LARGE";

/** @deprecated Use ImportErrorResponse from './universal.ts' */
export interface ImportErrorResponse {
  success: false;
  error: ImportErrorCode;
  message: string;
}
