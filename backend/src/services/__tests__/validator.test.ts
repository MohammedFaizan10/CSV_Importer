import { validateAndSanitizeRecord, validateAiOutput } from "../validator";
import { DetectedSchema } from "../../types/universal";

describe("Universal Validator", () => {
  const dummySchema: DetectedSchema = {
    columns: ["Name", "Price", "In Stock"],
    column_types: {
      Name: "string",
      Price: "currency",
      "In Stock": "boolean",
    },
    sample_values: {
      Name: ["Widget A"],
      Price: ["29.99"],
      "In Stock": ["true"],
    },
    total_rows: 1,
  };

  describe("validateAndSanitizeRecord", () => {
    it("should successfully validate a complete, valid record", () => {
      const raw = {
        Name: "Widget A",
        Price: 29.99,
        "In Stock": true,
        _metadata: {
          row_number: 1,
          import_timestamp: "2026-07-10T20:00:00.000Z",
          field_types: {
            Name: "string",
            Price: "currency",
            "In Stock": "boolean",
          },
        },
      };

      const result = validateAndSanitizeRecord(raw, dummySchema, { ...raw }, 1);
      expect("record" in result).toBe(true);
      if ("record" in result) {
        expect(result.record.Name).toBe("Widget A");
        expect(result.record.Price).toBe(29.99);
        expect(result.record["In Stock"]).toBe(true);
        expect(result.record._metadata.row_number).toBe(1);
      }
    });

    it("should skip completely empty rows (excluding _metadata)", () => {
      const raw = {
        Name: "",
        Price: "",
        "In Stock": null,
        _metadata: {
          row_number: 2,
          import_timestamp: "2026-07-10T20:00:00.000Z",
          field_types: {},
        },
      };

      const result = validateAndSanitizeRecord(raw, dummySchema, { ...raw }, 2);
      expect("skipped" in result).toBe(true);
      if ("skipped" in result) {
        expect(result.skipped.reason).toBe("Row is completely empty");
        expect(result.skipped.row_number).toBe(2);
      }
    });

    it("should prevent CSV injection by prepending a single quote to dangerous prefix characters", () => {
      const rawWithInjection = {
        Name: "=1+1",
        Price: "+100",
        "In Stock": "-true",
        _metadata: {
          row_number: 3,
          import_timestamp: "2026-07-10T20:00:00.000Z",
          field_types: {},
        },
      };

      const result = validateAndSanitizeRecord(rawWithInjection, dummySchema, { ...rawWithInjection }, 3);
      expect("record" in result).toBe(true);
      if ("record" in result) {
        expect(result.record.Name).toBe("'=1+1");
        expect(result.record.Price).toBe("'+100");
        expect(result.record["In Stock"]).toBe("'-true");
      }
    });

    it("should preserve numbers and booleans as safe types from sanitization", () => {
      const rawSafe = {
        Name: "Safe Widget",
        Price: -45.5, // numeric negative is safe when number type
        "In Stock": false, // boolean false is safe
      };

      const result = validateAndSanitizeRecord(rawSafe, dummySchema, { ...rawSafe }, 4);
      expect("record" in result).toBe(true);
      if ("record" in result) {
        expect(result.record.Name).toBe("Safe Widget");
        expect(result.record.Price).toBe(-45.5);
        expect(result.record["In Stock"]).toBe(false);
      }
    });

    it("should ensure _metadata is preserved and correctly updated if present, or generated if missing", () => {
      const rawNoMetadata = {
        Name: "Widget B",
        Price: 9.99,
        "In Stock": true,
      };

      const result = validateAndSanitizeRecord(rawNoMetadata, dummySchema, { ...rawNoMetadata }, 5);
      expect("record" in result).toBe(true);
      if ("record" in result) {
        expect(result.record._metadata).toBeDefined();
        expect(result.record._metadata.row_number).toBe(5);
        expect(result.record._metadata.import_timestamp).toBeDefined();
      }
    });
  });

  describe("validateAndSanitizeRecord - CRM Mode", () => {
    const crmSchema: DetectedSchema = {
      columns: ["name", "email", "mobile_without_country_code"],
      column_types: { name: "string", email: "email", mobile_without_country_code: "phone" },
      sample_values: {},
      total_rows: 1,
    };

    it("should successfully validate a record with valid email", () => {
      const raw = {
        name: "Alice Smith",
        email: "alice@example.com",
        mobile_without_country_code: "",
        crm_status: "GOOD_LEAD_FOLLOW_UP",
        data_source: "leads_on_demand",
      };

      const result = validateAndSanitizeRecord(raw, crmSchema, { ...raw }, 1, "crm");
      expect("record" in result).toBe(true);
      if ("record" in result) {
        expect(result.record.name).toBe("Alice Smith");
        expect(result.record.email).toBe("alice@example.com");
        expect(result.record.crm_status).toBe("GOOD_LEAD_FOLLOW_UP");
        expect(result.record.data_source).toBe("leads_on_demand");
        expect(result.record.city).toBe(""); // Ensure missing CRM fields are set to ""
      }
    });

    it("should successfully validate a record with valid mobile only", () => {
      const raw = {
        name: "Bob Jones",
        email: "invalid-email",
        mobile_without_country_code: "+91 98765 43210",
      };

      const result = validateAndSanitizeRecord(raw, crmSchema, { ...raw }, 2, "crm");
      expect("record" in result).toBe(true);
      if ("record" in result) {
        expect(result.record.name).toBe("Bob Jones");
        expect(result.record.email).toBe(""); // Invalid email coerced to ""
        expect(result.record.mobile_without_country_code).toBe("919876543210"); // Sanitized to digits only
      }
    });

    it("should still import a record with neither valid email nor mobile (soft warning only)", () => {
      const raw = {
        name: "Charlie Brown",
        email: "not-an-email",
        mobile_without_country_code: "123", // too short (valid is 7-15 digits)
      };

      const result = validateAndSanitizeRecord(raw, crmSchema, { ...raw }, 3, "crm");
      // Should be imported, not skipped — the contact-info check is now a soft warning
      expect("record" in result).toBe(true);
      if ("record" in result) {
        expect(result.record.name).toBe("Charlie Brown");
        expect(result.record.email).toBe(""); // Invalid email cleared
        expect(result.record.mobile_without_country_code).toBe(""); // Too short, cleared
      }
    });

    it("should coerce invalid crm_status and data_source enums to empty string", () => {
      const raw = {
        name: "David Miller",
        email: "david@example.com",
        crm_status: "INVALID_STATUS",
        data_source: "INVALID_SOURCE",
      };

      const result = validateAndSanitizeRecord(raw, crmSchema, { ...raw }, 4, "crm");
      expect("record" in result).toBe(true);
      if ("record" in result) {
        expect(result.record.crm_status).toBe("");
        expect(result.record.data_source).toBe("");
      }
    });
  });

  describe("validateAiOutput", () => {
    it("should correctly partition clean records and empty skipped records", () => {
      const aiImported = [
        {
          Name: "Widget A",
          Price: 29.99,
          "In Stock": true,
          _metadata: { row_number: 1, import_timestamp: "", field_types: {} },
        },
        {
          Name: "",
          Price: "",
          "In Stock": "",
          _metadata: { row_number: 2, import_timestamp: "", field_types: {} },
        },
      ];

      const aiSkipped = [
        {
          original_row: { Name: "Broken" },
          reason: "Format invalid",
          row_number: 3,
        },
      ];

      const summary = validateAiOutput(aiImported, aiSkipped, dummySchema);
      expect(summary.imported).toHaveLength(1);
      expect(summary.skipped).toHaveLength(2);
      expect(summary.imported[0].Name).toBe("Widget A");
      expect(summary.skipped[1].row_number).toBe(2);
      expect(summary.skipped[1].reason).toBe("Row is completely empty");
    });
  });
});
