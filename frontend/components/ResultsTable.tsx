"use client";

import { UniversalRecord, DataType } from "../types/universal";

interface ResultsTableProps {
  records: UniversalRecord[];
}

/**
 * Formats a value based on its detected data type
 */
function formatValue(value: unknown, dataType: DataType): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  switch (dataType) {
    case "date":
      // Format ISO date to readable format
      try {
        const date = new Date(String(value));
        return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
      } catch {
        return String(value);
      }

    case "boolean":
      return value === true || String(value).toLowerCase() === "true" ? "✓" : "✗";

    case "currency":
      // Attempt to format as currency
      const num = typeof value === "number" ? value : parseFloat(String(value));
      if (!isNaN(num)) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD", // Default USD, could be detected or configured
        }).format(num);
      }
      return String(value);

    case "percentage":
      const pct = typeof value === "number" ? value : parseFloat(String(value));
      if (!isNaN(pct)) {
        // If it's a decimal like 0.25, format as 25.00%. If it's already > 1 (e.g. 25), display as 25.00%
        const normalizedPct = pct <= 1 && pct >= 0 ? pct * 100 : pct;
        return `${normalizedPct.toFixed(2)}%`;
      }
      return String(value);

    case "url":
      return String(value);

    case "email":
      return String(value);

    default:
      return String(value);
  }
}

/**
 * Extracts column names from the first record (excluding _metadata)
 */
function getColumns(records: UniversalRecord[]): string[] {
  if (records.length === 0) return [];

  const firstRecord = records[0];
  return Object.keys(firstRecord).filter((key) => key !== "_metadata");
}

export default function ResultsTable({ records }: ResultsTableProps) {
  if (records.length === 0) {
    return (
      <div
        className="glass rounded-xl px-5 py-8 text-center text-sm"
        style={{ color: "var(--muted)" }}
      >
        No records imported.
      </div>
    );
  }

  const columns = getColumns(records);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        className="overflow-auto max-h-[500px] max-w-full"
        style={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="sticky top-0 z-10 text-left px-3 py-2.5 font-medium whitespace-nowrap"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontSize: "10px",
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => {
              const fieldTypes = record._metadata?.field_types ?? {};

              return (
                <tr
                  key={idx}
                  style={{
                    background: "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(200,169,110,0.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {columns.map((column) => {
                    const value = record[column];
                    const dataType = fieldTypes[column] ?? "string";
                    const formatted = formatValue(value, dataType);

                    return (
                      <td
                        key={column}
                        className="px-3 py-2.5 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          color:
                            formatted === "—"
                              ? "rgba(255,255,255,0.18)"
                              : "var(--ink-soft)",
                        }}
                        title={String(value)} // Show full value on hover
                      >
                        {formatted}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
