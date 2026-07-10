import { parse } from "csv-parse/sync";
import { RawCsvRow } from "../types/universal";

export class InvalidCsvError extends Error {
  constructor(message = "The uploaded file could not be parsed as a valid CSV.") {
    super(message);
    this.name = "InvalidCsvError";
  }
}

export interface ParsedCsv {
  headers: string[];
  rows: RawCsvRow[];
  skippedRowCount: number; // rows dropped due to inconsistent column counts
}

/**
 * Strips a leading UTF-8 BOM if present.
 */
function stripBom(input: string): string {
  if (input.charCodeAt(0) === 0xfeff) {
    return input.slice(1);
  }
  return input;
}

/**
 * Parses a CSV buffer into an array of objects keyed by the raw header strings.
 * Never assumes fixed column names. Never hand-rolls quote/comma/newline handling —
 * that's delegated entirely to csv-parse.
 */
export function parseCsvBuffer(buffer: Buffer): ParsedCsv {
  let text: string;
  try {
    text = stripBom(buffer.toString("utf-8"));
  } catch {
    throw new InvalidCsvError();
  }

  if (text.trim().length === 0) {
    // Empty file entirely - treat as zero rows, not an error, per spec 2.2.
    return { headers: [], rows: [], skippedRowCount: 0 };
  }

  let records: string[][];
  try {
    records = parse(text, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true, // don't throw on ragged rows - we filter manually
      trim: false,
    }) as string[][];
  } catch (err) {
    throw new InvalidCsvError();
  }

  if (records.length === 0) {
    return { headers: [], rows: [], skippedRowCount: 0 };
  }

  const headers = records[0].map((h) => (h ?? "").trim());
  const dataRows = records.slice(1);

  const rows: RawCsvRow[] = [];
  let skippedRowCount = 0;

  for (const record of dataRows) {
    // Filter out fully-empty trailing rows (all cells blank).
    const isEmptyRow = record.every((cell) => (cell ?? "").trim() === "");
    if (isEmptyRow) continue;

    // Inconsistent column count vs header -> log warning & skip, per spec.
    if (record.length !== headers.length) {
      skippedRowCount++;
      // eslint-disable-next-line no-console
      console.warn(
        `[csvParser] Skipping row with ${record.length} columns, expected ${headers.length}: ${JSON.stringify(
          record
        )}`
      );
      continue;
    }

    const row: RawCsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = record[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows, skippedRowCount };
}
