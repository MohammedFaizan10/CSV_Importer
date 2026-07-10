/**
 * @deprecated — THIS FILE IS DEPRECATED AND WILL BE REMOVED.
 *
 * Migration guide:
 * ────────────────
 *   CrmRecord           → UniversalRecord     (from './universal.ts')
 *   CrmStatus           → removed (no fixed status enums)
 *   DataSource          → removed (no fixed data source enums)
 *   CRM_RECORD_FIELDS   → removed (columns are dynamic from CSV headers)
 *   SkippedRecord       → SkippedRecord        (from './universal.ts', now includes row_number)
 *   ImportSuccessResp... → ImportSuccessResponse (from './universal.ts', now includes schema)
 *   ImportErrorResp...   → ImportErrorResponse   (from './universal.ts')
 *   ImportResponse       → ImportResponse        (from './universal.ts')
 *   UploadState          → UploadState           (from './universal.ts')
 *   CsvPreview           → CsvPreview            (from './universal.ts')
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

/** @deprecated Removed in universal model */
export type CrmStatus =
  | "GOOD_LEAD_FOLLOW_UP"
  | "DID_NOT_CONNECT"
  | "BAD_LEAD"
  | "SALE_DONE";

/** @deprecated Removed in universal model */
export type DataSource =
  | "leads_on_demand"
  | "meridian_tower"
  | "eden_park"
  | "varah_swamy"
  | "sarjapur_plots";

/** @deprecated Use SkippedRecord from './universal.ts' */
export interface SkippedRecord {
  original_row: Record<string, unknown>;
  reason: string;
}

/** @deprecated Use ImportSuccessResponse from './universal.ts' */
export interface ImportSuccessResponse {
  success: true;
  total_rows: number;
  total_imported: number;
  total_skipped: number;
  imported: CrmRecord[];
  skipped: SkippedRecord[];
}

/** @deprecated Use ImportErrorResponse from './universal.ts' */
export interface ImportErrorResponse {
  success: false;
  error: string;
  message: string;
}

/** @deprecated Use ImportResponse from './universal.ts' */
export type ImportResponse = ImportSuccessResponse | ImportErrorResponse;

/** @deprecated Removed — columns are dynamic in the universal model */
export const CRM_RECORD_FIELDS: (keyof CrmRecord)[] = [
  "created_at", "name", "email", "country_code",
  "mobile_without_country_code", "company", "city", "state",
  "country", "lead_owner", "crm_status", "crm_note",
  "data_source", "possession_time", "description",
];

/** @deprecated Use UploadState from './universal.ts' */
export type UploadState = "idle" | "dragging" | "file_selected" | "error";

/** @deprecated Use CsvPreview from './universal.ts' */
export interface CsvPreview {
  columns: string[];
  rows: Record<string, string>[];
  totalRowCount: number;
}
