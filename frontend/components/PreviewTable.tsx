"use client";

import { CsvPreview } from "../types/universal";

interface PreviewTableProps {
  preview: CsvPreview;
}

export default function PreviewTable({ preview }: PreviewTableProps) {
  const { columns, rows, totalRowCount } = preview;
  const isCapped = totalRowCount > rows.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          <span className="tabular" style={{ color: "var(--accent)" }}>{columns.length}</span> columns
          {" "}·{" "}
          <span className="tabular" style={{ color: "var(--accent)" }}>{totalRowCount.toLocaleString()}</span> rows
        </p>
        {isCapped && (
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Previewing {rows.length} of {totalRowCount.toLocaleString()} rows
          </p>
        )}
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div
          className="overflow-auto max-h-[360px] max-w-full"
          style={{
            background: "rgba(255,255,255,0.02)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="sticky top-0 z-10 text-left px-3 py-2.5 font-medium whitespace-nowrap"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--ink-soft)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(200,169,110,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)")}
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-2 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        color: "var(--ink-soft)",
                      }}
                    >
                      {row[col] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
