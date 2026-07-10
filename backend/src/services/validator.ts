import {
  UniversalRecord,
  SkippedRecord,
  DetectedSchema,
  RecordMetadata,
} from "../types/universal";

const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];

function isValidCrmStatus(value: unknown): boolean {
  return typeof value === "string" && CRM_STATUS_VALUES.includes(value);
}

function isValidDataSource(value: unknown): boolean {
  return typeof value === "string" && DATA_SOURCE_VALUES.includes(value);
}

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function isValidIsoDate(value: string): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

function toIsoOrEmpty(value: string): string {
  if (!isValidIsoDate(value)) return "";
  return new Date(value).toISOString();
}

function sanitizeMobile(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidMobile(digits: string): boolean {
  return digits.length >= 7 && digits.length <= 15;
}

function isValidEmail(value: string): boolean {
  if (!value.includes("@")) return false;
  const domainPart = value.split("@")[1] ?? "";
  return domainPart.includes(".");
}

/**
 * Sanitizes a value to prevent CSV injection attacks.
 * Characters that can trigger formula execution in spreadsheet apps: = + - @ \t \r
 */
function sanitizeCsvValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;

  // Numbers and booleans are safe as-is
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
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
 * Validates that a record has all expected columns from the detected schema.
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
 * Validates and sanitizes a single record.
 * Supports both "universal" and "crm" modes.
 */
export function validateAndSanitizeRecord(
  raw: Record<string, unknown>,
  schema: DetectedSchema,
  originalRow: Record<string, unknown>,
  rowNumber: number,
  mode: "universal" | "crm" = "universal"
): { record: UniversalRecord } | { skipped: SkippedRecord } {
  // Check if row is completely empty
  const allValues = Object.entries(raw).filter(([key]) => key !== "_metadata");
  const hasAnyValue = allValues.some(
    ([, val]) => val !== null && val !== undefined && String(val).trim() !== ""
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

  if (mode === "crm") {
    // Legacy CRM Lead Validation rules
    const email = raw.email ? safeString(raw.email).trim().toLowerCase() : "";
    const emailValid = isValidEmail(email);

    const mobileRaw = raw.mobile_without_country_code ? safeString(raw.mobile_without_country_code) : "";
    const mobileDigits = sanitizeMobile(mobileRaw);
    const mobileValid = isValidMobile(mobileDigits);

    // If neither email nor mobile is present, still import but log a note.
    // Previously this hard-skipped the record, which meant non-contact CSVs
    // (colors, products, inventory, etc.) would be entirely dropped in CRM mode.
    if (!emailValid && !mobileValid) {
      console.warn(`[validator] CRM row ${rowNumber}: no valid email or mobile found — importing anyway`);
    }

    // Build standard CRM record
    const crmStatus = isValidCrmStatus(raw.crm_status) ? (raw.crm_status as string) : "";
    const dataSource = isValidDataSource(raw.data_source) ? (raw.data_source as string) : "";

    const crmRecord: Record<string, unknown> = {
      created_at: raw.created_at ? toIsoOrEmpty(safeString(raw.created_at)) : "",
      name: safeString(raw.name),
      email: emailValid ? email : "",
      country_code: safeString(raw.country_code),
      mobile_without_country_code: mobileValid ? mobileDigits : "",
      company: safeString(raw.company),
      city: safeString(raw.city),
      state: safeString(raw.state),
      country: safeString(raw.country),
      lead_owner: safeString(raw.lead_owner),
      crm_status: crmStatus,
      crm_note: safeString(raw.crm_note),
      data_source: dataSource,
      possession_time: safeString(raw.possession_time),
      description: safeString(raw.description),
    };

    // Apply CSV injection prevention
    const sanitizedCrm: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(crmRecord)) {
      sanitizedCrm[key] = sanitizeCsvValue(value);
    }

    sanitizedCrm._metadata = {
      row_number: rowNumber,
      import_timestamp: new Date().toISOString(),
      field_types: Object.fromEntries(
        Object.keys(crmRecord).map((k) => [k, k === "created_at" ? "date" : k === "email" ? "email" : k === "mobile_without_country_code" ? "phone" : "string"])
      ),
    } satisfies RecordMetadata;

    return { record: sanitizedCrm as UniversalRecord };
  }

  // Universal Mode
  if (!validateRecordCompleteness(raw, schema)) {
    console.warn(`[validator] Record at row ${rowNumber} missing some schema columns — proceeding anyway`);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "_metadata") {
      sanitized[key] = value;
    } else {
      sanitized[key] = sanitizeCsvValue(value);
    }
  }

  if (!sanitized._metadata || typeof sanitized._metadata !== "object") {
    sanitized._metadata = {
      row_number: rowNumber,
      import_timestamp: new Date().toISOString(),
      field_types: {},
    } satisfies RecordMetadata;
  }

  return { record: sanitized as UniversalRecord };
}

export interface ValidationSummary {
  imported: UniversalRecord[];
  skipped: SkippedRecord[];
}

/**
 * Validates AI output batch.
 */
export function validateAiOutput(
  aiImported: UniversalRecord[],
  aiSkipped: SkippedRecord[],
  schema: DetectedSchema,
  mode: "universal" | "crm" = "universal"
): ValidationSummary {
  const imported: UniversalRecord[] = [];
  const skipped: SkippedRecord[] = [...aiSkipped];

  for (const raw of aiImported) {
    const rowNumber = raw._metadata?.row_number ?? 0;
    const originalRow = { ...raw };
    delete (originalRow as Record<string, unknown>)._metadata;

    const result = validateAndSanitizeRecord(
      raw as Record<string, unknown>,
      schema,
      originalRow as Record<string, unknown>,
      rowNumber,
      mode
    );

    if ("record" in result) {
      imported.push(result.record);
    } else {
      skipped.push(result.skipped);
    }
  }

  return { imported, skipped };
}
