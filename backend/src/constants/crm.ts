/**
 * @deprecated This file is deprecated. Use `./config.ts` instead.
 * All CRM-specific constants and validation functions have been removed.
 * This file will be deleted once all references are confirmed migrated.
 */

import { CrmStatus, DataSource } from "../types/crm";

/** @deprecated Use config.ts BATCH_SIZE instead. */
export const CRM_STATUS_VALUES: CrmStatus[] = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

/** @deprecated Removed in universal CSV importer refactor. */
export const DATA_SOURCE_VALUES: DataSource[] = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];

/** @deprecated Removed in universal CSV importer refactor. */
export const CRM_RECORD_FIELDS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
] as const;

// Re-export from config.ts for backward compatibility
export { BATCH_SIZE, MAX_FILE_SIZE_BYTES, MAX_RETRY_ATTEMPTS, RETRY_DELAYS_MS, ACCEPTED_MIME_TYPES } from "./config";

/** @deprecated Removed in universal CSV importer refactor. */
export function isValidCrmStatus(value: unknown): value is CrmStatus {
  return typeof value === "string" && (CRM_STATUS_VALUES as string[]).includes(value);
}

/** @deprecated Removed in universal CSV importer refactor. */
export function isValidDataSource(value: unknown): value is DataSource {
  return typeof value === "string" && (DATA_SOURCE_VALUES as string[]).includes(value);
}
