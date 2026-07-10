import { Router, Request, Response } from "express";
import multer from "multer";
import { parseCsvBuffer, InvalidCsvError } from "../services/csvParser";
import { extractUniversalRecords } from "../services/aiExtractor";
import { validateAiOutput } from "../services/validator";
import {
  ImportErrorResponse,
  ImportSuccessResponse,
  DetectedSchema,
} from "../types/universal";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "../constants/config";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Accept at multer level; some CSV exports mislabel mimetype
      // entirely (e.g. octet-stream). We rely on content-based CSV parsing to
      // catch genuinely invalid files rather than over-rejecting on mimetype.
      cb(null, true);
    }
  },
});

function sendError(
  res: Response,
  status: number,
  error: ImportErrorResponse["error"],
  message: string,
  details?: string
) {
  const body: ImportErrorResponse = { success: false, error, message };
  if (details) body.details = details;
  res.status(status).json(body);
}

router.post("/import", (req: Request, res: Response) => {
  upload.single("file")(req, res, async (err: unknown) => {
    if (err) {
      const multerErr = err as { code?: string };
      if (multerErr.code === "LIMIT_FILE_SIZE") {
        return sendError(
          res,
          400,
          "FILE_TOO_LARGE",
          "File exceeds the maximum allowed size of 10 MB."
        );
      }
      return sendError(res, 400, "NO_FILE_UPLOADED", "No file was provided in the request.");
    }

    const file = req.file;
    if (!file || !file.buffer || file.buffer.length === 0) {
      return sendError(res, 400, "NO_FILE_UPLOADED", "No file was provided in the request.");
    }

    let headers: string[];
    let rows: ReturnType<typeof parseCsvBuffer>["rows"];
    try {
      const parsed = parseCsvBuffer(file.buffer);
      headers = parsed.headers;
      rows = parsed.rows;
    } catch (e) {
      if (e instanceof InvalidCsvError) {
        return sendError(res, 422, "INVALID_CSV", e.message);
      }
      return sendError(
        res,
        422,
        "INVALID_CSV",
        "The uploaded file could not be parsed as a valid CSV."
      );
    }

    if (rows.length === 0) {
      // Build a minimal schema from headers for the empty response
      const emptySchema: DetectedSchema = {
        columns: headers,
        column_types: Object.fromEntries(headers.map((h) => [h, "unknown" as const])),
        sample_values: Object.fromEntries(headers.map((h) => [h, []])),
        total_rows: 0,
      };
      const empty: ImportSuccessResponse = {
        success: true,
        total_rows: 0,
        total_imported: 0,
        total_skipped: 0,
        imported: [],
        skipped: [],
        schema: emptySchema,
      };
      return res.status(200).json(empty);
    }
    try {
      const mode = req.query.mode === "crm" ? "crm" : "universal";
      const aiResult = await extractUniversalRecords(headers, rows, mode);

      // Build schema — use AI-detected schema if available, otherwise construct from headers
      const schema: DetectedSchema = aiResult.detected_schema ?? {
        columns: headers,
        column_types: Object.fromEntries(headers.map((h) => [h, "unknown" as const])),
        sample_values: Object.fromEntries(headers.map((h) => [h, []])),
        total_rows: rows.length,
      };

      // Log schema detection results (Task 9)
      console.log(`[import] Schema detected: ${schema.columns.length} columns for ${rows.length} rows`);
      if (schema.column_types) {
        console.log(`[import] Column types: ${JSON.stringify(schema.column_types)}`);
      }

      const { imported, skipped } = validateAiOutput(aiResult.imported, aiResult.skipped, schema, mode);

      console.log(`[import] Post-validation: ${imported.length} imported, ${skipped.length} skipped (mode=${mode})`);
      if (imported.length === 0 && aiResult.imported.length > 0) {
        console.warn(`[import] WARNING: Validator dropped all ${aiResult.imported.length} AI records. First AI record keys:`, Object.keys(aiResult.imported[0] ?? {}));
        if (aiResult.imported[0]) {
          console.warn(`[import] First AI record sample:`, JSON.stringify(aiResult.imported[0]).substring(0, 500));
        }
      }

      const response: ImportSuccessResponse = {
        success: true,
        total_rows: rows.length,
        total_imported: imported.length,
        total_skipped: skipped.length,
        imported,
        skipped,
        schema,
      };
      return res.status(200).json(response);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[import route] AI processing failed:", e);
      return sendError(
        res,
        500,
        "AI_PROCESSING_FAILED",
        "The data extraction step failed. Please try again."
      );
    }
  });
});

export default router;
