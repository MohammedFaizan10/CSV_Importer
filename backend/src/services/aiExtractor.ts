import OpenAI from "openai";
import { AiBatchResult, RawCsvRow, UniversalRecord } from "../types/universal";
import { BATCH_SIZE, MAX_RETRY_ATTEMPTS, RETRY_DELAYS_MS } from "../constants/config";

if (!process.env.NVIDIA_API_KEY) {
  throw new Error("[aiExtractor] NVIDIA_API_KEY is not set. Add it to your .env file.");
}

const openrouter = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// NVIDIA NIM model — check available models at https://build.nvidia.com/explore/discover
const MODEL = process.env.NVIDIA_MODEL ?? "openai/gpt-oss-120b";
console.log(`[aiExtractor] Using NVIDIA model: ${MODEL}`);

/**
 * Universal system prompt — domain-agnostic, handles any CSV structure.
 */
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
6. If a cell contains multiple lines, preserve line breaks as literal \\n characters

CSV SAFETY
- Replace internal newlines in cell values with the two literal characters "\\\\n"
- Do NOT escape commas or quotes (handled downstream)
- Ensure all string output is valid JSON

OUTPUT FORMAT
Return ONLY valid JSON matching the schema above. No markdown code fences, no prose,
no explanations, no leading or trailing text. Your entire response must be a single
parseable JSON object.`;

/**
 * CRM system prompt — semantically maps raw data fields to standard 15 CRM fields.
 */
const CRM_SYSTEM_PROMPT = `You are a data-extraction and semantic mapping engine for GrowEasy, a real estate CRM.

TASK
You will receive raw CSV rows from different lead sources (Facebook Ads, Google Ads, broker spreadsheets, etc.). Each source uses arbitrary column headers, date formats, and phone conventions. Your job is to semantically map each raw row onto a fixed target CRM schema.

CRITICAL CONSISTENCY RULE
You must decide the column mapping ONCE based on the headers and apply the EXACT SAME mapping to EVERY row. If you decide that CSV column "Name" maps to CRM field "name" for the first row, you MUST map it the same way for ALL rows. Never map the same source column to different target fields across rows.

TARGET SCHEMA
Your output JSON must structure every record under "imported" with EXACTLY these 15 fields. If a field is not present or cannot be inferred from the raw CSV data, set its value to an empty string "".

1. "created_at": Date when lead was created. Parse and convert to ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).
2. "name": Map any source column named "Name", "Full Name", "First Name", "Contact Name", or similar directly to this field. If split into First/Last name columns, combine them (e.g. "John Doe"). Always map the Name column here — never put it in description.
3. "email": Email address of the lead. Must contain "@" and a domain with a period.
4. "country_code": Phone country code (e.g., "+91", "+1").
5. "mobile_without_country_code": Mobile/phone number without the country code. Digits only, 7-15 digits.
6. "company": Company name.
7. "city": City.
8. "state": State.
9. "country": Country.
10. "lead_owner": Assigned agent/owner.
11. "crm_status": Must semantically map to one of: "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE", or "" if unknown.
12. "crm_note": Comments, details, or notes about the lead.
13. "data_source": Must semantically map to one of: "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots", or "" if unknown.
14. "possession_time": Timeline for buying/investing (e.g. "Immediate", "3 months").
15. "description": Any columns or data that do NOT clearly map to any of the 14 CRM fields above. Serialize ALL unmapped column data as a readable string (e.g. "HEX: #FFFFFF | RGB: rgb(255,255,255)") to prevent data loss. Use pipe "|" separators for readability.

MAPPING GUIDANCE
- Map source columns to CRM fields based on column name similarity. A column called "Name" goes to "name", "Email" goes to "email", "Phone"/"Mobile" goes to "mobile_without_country_code", etc.
- For CSVs without typical lead columns (e.g., product catalogs, currency lists, inventory): Map the most prominent identifier column to "name" (e.g., "Product Name" → "name", "Code" → "name", "Item ID" → "name"), and serialize ALL other columns into the "description" field as a readable string.
- If a CSV has NO columns matching ANY of the 14 specific CRM fields, map the first/primary column to "name" and the rest to "description".
- Only columns that do NOT match any of the 14 CRM fields should go into "description".
- Always apply the SAME mapping for every row in the batch.
- Never skip rows just because they lack email or mobile — import them with whatever data is available.

OUTPUT SCHEMA
Return a single JSON object with exactly these fields:
{
  "imported": [ <array of crm record objects with the 15 fields above> ],
  "skipped": [ <array of skipped records with reasons> ],
  "detected_schema": {
    "columns": ["created_at", "name", "email", "country_code", "mobile_without_country_code", "company", "city", "state", "country", "lead_owner", "crm_status", "crm_note", "data_source", "possession_time", "description"],
    "column_types": {
      "created_at": "date",
      "name": "string",
      "email": "email",
      "country_code": "string",
      "mobile_without_country_code": "phone",
      "company": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "lead_owner": "string",
      "crm_status": "string",
      "crm_note": "string",
      "data_source": "string",
      "possession_time": "string",
      "description": "string"
    },
    "sample_values": {
      "created_at": ["2026-07-10T20:00:00.000Z"],
      "name": ["John Doe"]
    },
    "total_rows": <number>
  }
}

RECORD METADATA
Each record in "imported" must also include a "_metadata" field:
{
  "row_number": <1-indexed row number>,
  "import_timestamp": <ISO 8601 timestamp>,
  "field_types": {
    "created_at": "date",
    "name": "string",
    "email": "email",
    "country_code": "string",
    "mobile_without_country_code": "phone",
    "company": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "lead_owner": "string",
    "crm_status": "string",
    "crm_note": "string",
    "data_source": "string",
    "possession_time": "string",
    "description": "string"
  }
}

SKIP RULES
Skip a row (add to "skipped" array) ONLY if:
- The row is completely empty (all fields are empty strings, null, or whitespace)

IMPORTANT: Import ALL rows that contain ANY data, even if they don't have email or mobile numbers. The CRM can store records with partial information (e.g. just a name, or just a company). Missing contact fields should be set to empty string "", but the row should still be imported.

DATA INTEGRITY RULES (CRITICAL)
1. NEVER invent, guess, or hallucinate data that is not present in the row
2. If a field is empty or missing, use empty string ""
3. Preserve exact spelling, capitalization, and formatting of text values
4. If a cell contains multiple lines, preserve line breaks as literal \\\\n characters

Return ONLY valid JSON matching the schema above. No markdown code fences, no prose.`;

function buildUserPrompt(headers: string[], rows: RawCsvRow[]): string {
  return `Here are the raw CSV rows to process. The column headers from the original file are:
${JSON.stringify(headers)}

Process the following rows and return the JSON result:
${JSON.stringify(rows, null, 2)}`;
}

function chunkRows(rows: RawCsvRow[], size: number): RawCsvRow[][] {
  const chunks: RawCsvRow[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
}

export function extractJsonFromText(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn(`[aiExtractor] JSON.parse failed. Raw text preview: ${cleaned.slice(0, 300)}`);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parse the "try again in Xs" wait time from a rate-limit message, with a fallback. */
function parseRetryAfterMs(errMessage: string, fallbackMs: number): number {
  const match = errMessage.match(/try again in ([0-9.]+)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 500; // +500ms safety buffer
  }
  return fallbackMs;
}

export function validateAiResponse(parsed: unknown): AiBatchResult | null {
  if (!parsed || typeof parsed !== "object") return null;

  const obj = parsed as Record<string, unknown>;

  // Validate required arrays
  if (!Array.isArray(obj.imported) || !Array.isArray(obj.skipped)) {
    return null;
  }

  // Validate each imported record has _metadata
  for (const record of obj.imported) {
    if (typeof record !== "object" || !record || !(record as Record<string, unknown>)._metadata) {
      console.warn("[aiExtractor] Record missing _metadata, adding default metadata");
      // Add default metadata if missing rather than failing the whole batch
      const rec = record as Record<string, unknown>;
      if (rec && typeof rec === "object") {
        rec._metadata = {
          row_number: 0,
          import_timestamp: new Date().toISOString(),
          field_types: {},
        };
      }
    }
  }

  // Extract detected_schema if present
  const result: AiBatchResult = {
    imported: obj.imported as UniversalRecord[],
    skipped: obj.skipped as AiBatchResult["skipped"],
  };

  if (obj.detected_schema && typeof obj.detected_schema === "object") {
    result.detected_schema = obj.detected_schema as AiBatchResult["detected_schema"];
  }

  return result;
}

/**
 * Calls the LLM for a single batch, with retry/backoff on failures.
 * On 429, waits exactly as long as the API asks before retrying.
 * Returns null if all attempts are exhausted.
 */
async function callAiForBatch(
  headers: string[],
  rows: RawCsvRow[],
  mode: "universal" | "crm" = "universal"
): Promise<AiBatchResult | null> {
  const userPrompt = buildUserPrompt(headers, rows);
  const systemPrompt = mode === "crm" ? CRM_SYSTEM_PROMPT : SYSTEM_PROMPT;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await openrouter.chat.completions.create({
        model: MODEL,
        max_tokens: 4096,
        temperature: 1,
        top_p: 1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const text = response.choices?.[0]?.message?.content;
      if (!text) {
        console.warn(`[aiExtractor] Attempt ${attempt}: empty response`);
        continue;
      }

      const parsed = extractJsonFromText(text);
      const result = validateAiResponse(parsed);

      if (result) {
        console.log(`[aiExtractor] Batch parsed: ${result.imported.length} imported, ${result.skipped.length} skipped`);

        // Log detected schema summary (Task 9)
        if (result.detected_schema) {
          console.log(`[aiExtractor] Detected schema: ${result.detected_schema.columns.length} columns`);
          console.log(`[aiExtractor] Column types: ${JSON.stringify(result.detected_schema.column_types)}`);
        }

        // Debug: log first skipped reason if everything was skipped
        if (result.imported.length === 0 && result.skipped.length > 0) {
          console.log(`[aiExtractor] First skip reason: "${result.skipped[0].reason}"`);
          console.log(`[aiExtractor] First skipped row sample: ${JSON.stringify(result.skipped[0].original_row).slice(0, 150)}`);
        }

        return result;
      }
      // Malformed JSON shape — log and retry
      console.warn(`[aiExtractor] Attempt ${attempt}: malformed response shape, retrying. Preview: ${text.slice(0, 200)}`);
    } catch (err: any) {
      const isRateLimit = err?.status === 429;
      const isInsufficientCredits = err?.status === 402;

      if (isInsufficientCredits) {
        console.warn(`[aiExtractor] 402 insufficient credits — aborting batch.`);
        return null;
      }

      const waitMs = isRateLimit
        ? parseRetryAfterMs(err?.message ?? "", RETRY_DELAYS_MS[attempt - 1] ?? 5000)
        : (RETRY_DELAYS_MS[attempt - 1] ?? 2000);

      console.warn(
        `[aiExtractor] Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed${isRateLimit ? ` (rate limit — waiting ${(waitMs / 1000).toFixed(1)}s)` : ""}: ${err?.message ?? err}`
      );

      if (attempt < MAX_RETRY_ATTEMPTS) {
        await sleep(waitMs);
      }
    }
  }

  return null;
}

/**
 * Processes rows sequentially in batches of BATCH_SIZE.
 * Sequential processing ensures we respect API rate limits.
 */
export async function extractUniversalRecords(
  headers: string[],
  rows: RawCsvRow[],
  mode: "universal" | "crm" = "universal"
): Promise<AiBatchResult> {
  const batches = chunkRows(rows, BATCH_SIZE);
  const imported: AiBatchResult["imported"] = [];
  const skipped: AiBatchResult["skipped"] = [];
  let detectedSchema: AiBatchResult["detected_schema"];

  console.log(`[aiExtractor] Processing ${rows.length} rows in ${batches.length} sequential batches in ${mode} mode`);

  for (let i = 0; i < batches.length; i++) {
    console.log(`[aiExtractor] Batch ${i + 1}/${batches.length} (${batches[i].length} rows)…`);
    const result = await callAiForBatch(headers, batches[i], mode);
    if (result === null) {
      console.warn(`[aiExtractor] Batch ${i + 1} returned null — marking all rows as skipped`);
      for (const row of batches[i]) {
        skipped.push({ original_row: row, reason: "AI processing failed for this batch", row_number: 0 });
      }
    } else {
      imported.push(...result.imported);
      skipped.push(...result.skipped);
      // Use the first batch's detected schema (subsequent batches should have same schema)
      if (!detectedSchema && result.detected_schema) {
        detectedSchema = result.detected_schema;
        console.log(`[aiExtractor] Schema detected from batch ${i + 1}: ${detectedSchema.columns.join(", ")}`);
      }
    }
  }

  console.log(`[aiExtractor] Complete: ${imported.length} imported, ${skipped.length} skipped`);

  // Log final schema validation (Task 9)
  if (detectedSchema) {
    console.log(`[aiExtractor] Final schema: ${detectedSchema.columns.length} columns, types: ${JSON.stringify(detectedSchema.column_types)}`);
  } else {
    console.warn(`[aiExtractor] No schema detected from AI response — will construct from headers`);
  }

  return { imported, skipped, detected_schema: detectedSchema };
}
