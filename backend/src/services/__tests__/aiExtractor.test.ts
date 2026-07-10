import { validateAiResponse, extractJsonFromText } from "../aiExtractor";

describe("AI Extractor Helpers", () => {
  describe("extractJsonFromText", () => {
    it("should parse clean JSON", () => {
      const input = '{"imported": [], "skipped": []}';
      const result = extractJsonFromText(input) as Record<string, unknown>;
      expect(result).toBeDefined();
      expect(result.imported).toEqual([]);
      expect(result.skipped).toEqual([]);
    });

    it("should strip markdown code fences", () => {
      const input = '```json\n{"imported": [], "skipped": []}\n```';
      const result = extractJsonFromText(input) as Record<string, unknown>;
      expect(result).toBeDefined();
      expect(result.imported).toEqual([]);
    });

    it("should return null for invalid JSON", () => {
      const input = "This is not JSON at all";
      const result = extractJsonFromText(input);
      expect(result).toBeNull();
    });

    it("should handle whitespace-padded JSON", () => {
      const input = '   \n  {"imported": [{"Name": "A"}], "skipped": []}  \n  ';
      const result = extractJsonFromText(input) as Record<string, unknown>;
      expect(result).toBeDefined();
      expect((result.imported as Array<Record<string, unknown>>)[0].Name).toBe("A");
    });
  });

  describe("validateAiResponse", () => {
    it("should return valid AiBatchResult when structure is correct", () => {
      const parsed = {
        imported: [
          {
            Name: "Widget A",
            Price: 29.99,
            _metadata: {
              row_number: 1,
              field_types: { Name: "string", Price: "currency" },
              import_timestamp: "2026-07-10T20:00:00.000Z",
            },
          },
        ],
        skipped: [],
        detected_schema: {
          columns: ["Name", "Price"],
          column_types: { Name: "string", Price: "currency" },
          sample_values: { Name: ["Widget A"], Price: ["29.99"] },
          total_rows: 1,
        },
      };

      const result = validateAiResponse(parsed);
      expect(result).not.toBeNull();
      expect(result!.imported).toHaveLength(1);
      expect(result!.imported[0].Name).toBe("Widget A");
      expect(result!.skipped).toHaveLength(0);
      expect(result!.detected_schema).toBeDefined();
      expect(result!.detected_schema!.columns).toEqual(["Name", "Price"]);
      expect(result!.detected_schema!.column_types.Price).toBe("currency");
    });

    it("should return null for non-object input", () => {
      expect(validateAiResponse(null)).toBeNull();
      expect(validateAiResponse(undefined)).toBeNull();
      expect(validateAiResponse("string")).toBeNull();
      expect(validateAiResponse(42)).toBeNull();
    });

    it("should return null when imported or skipped arrays are missing", () => {
      expect(validateAiResponse({ imported: [] })).toBeNull();
      expect(validateAiResponse({ skipped: [] })).toBeNull();
      expect(validateAiResponse({ imported: "not array", skipped: [] })).toBeNull();
    });

    it("should add default _metadata when record is missing it", () => {
      const parsed = {
        imported: [
          { Name: "Widget B", Price: 9.99 }, // no _metadata
        ],
        skipped: [],
      };

      const result = validateAiResponse(parsed);
      expect(result).not.toBeNull();
      expect(result!.imported[0]._metadata).toBeDefined();
      expect(result!.imported[0]._metadata.row_number).toBe(0);
      expect(result!.imported[0]._metadata.field_types).toEqual({});
    });

    it("should handle response without detected_schema", () => {
      const parsed = {
        imported: [
          {
            Name: "Widget C",
            _metadata: { row_number: 1, field_types: {}, import_timestamp: "" },
          },
        ],
        skipped: [],
      };

      const result = validateAiResponse(parsed);
      expect(result).not.toBeNull();
      expect(result!.detected_schema).toBeUndefined();
    });

    it("should pass through skipped records", () => {
      const parsed = {
        imported: [],
        skipped: [
          { original_row: { Name: "" }, reason: "Row is completely empty", row_number: 5 },
        ],
      };

      const result = validateAiResponse(parsed);
      expect(result).not.toBeNull();
      expect(result!.skipped).toHaveLength(1);
      expect(result!.skipped[0].reason).toBe("Row is completely empty");
      expect(result!.skipped[0].row_number).toBe(5);
    });
  });
});
