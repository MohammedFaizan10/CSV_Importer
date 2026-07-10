"use client";

import { useState } from "react";
import { SkippedRecord } from "../types/universal";

interface SkippedTableProps {
  records: SkippedRecord[];
}

export default function SkippedTable({ records }: SkippedTableProps) {
  const [open, setOpen] = useState(records.length > 0 && records.length <= 20);

  if (records.length === 0) {
    return (
      <div
        className="glass rounded-xl px-5 py-3.5 flex items-center gap-2.5 text-sm"
        style={{
          border: "1px solid rgba(74,222,128,0.15)",
          background: "rgba(74,222,128,0.04)",
        }}
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(74,222,128,0.15)" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span style={{ color: "var(--success)" }}>
          All rows imported — no rows were skipped.
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Collapsible header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "rgba(251,191,36,0.12)" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2.5">
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </span>
          <span className="font-medium text-sm" style={{ color: "var(--ink)" }}>
            Skipped rows
          </span>
          <span
            className="tabular text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: "rgba(251,191,36,0.10)",
              color: "var(--warning)",
            }}
          >
            {records.length}
          </span>
        </div>
        <div
          className="transition-transform duration-300"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--muted)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Table */}
      {open && (
        <div
          className="overflow-auto max-h-[360px] max-w-full animate-fade-in"
          style={{
            borderTop: "1px solid var(--border)",
            background: "rgba(255,255,255,0.015)",
          }}
        >
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr>
                <th
                  className="sticky top-0 z-10 text-left px-4 py-2.5 font-medium w-20"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontSize: "10px",
                  }}
                >
                  Row #
                </th>
                <th
                  className="sticky top-0 z-10 text-left px-4 py-2.5 font-medium w-48"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontSize: "10px",
                  }}
                >
                  Reason
                </th>
                <th
                  className="sticky top-0 z-10 text-left px-4 py-2.5 font-medium"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--muted)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontSize: "10px",
                  }}
                >
                  Original Row
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, idx) => (
                <tr
                  key={idx}
                  style={{ transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(251,191,36,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td
                    className="px-4 py-2.5 align-top whitespace-nowrap"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      color: "var(--muted)",
                    }}
                  >
                    {rec.row_number || idx + 1}
                  </td>
                  <td
                    className="px-4 py-2.5 align-top whitespace-nowrap"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      color: "var(--warning)",
                    }}
                  >
                    {rec.reason}
                  </td>
                  <td
                    className="px-4 py-2.5 max-w-[480px] align-top"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <code
                      className="text-xs break-all leading-relaxed"
                      style={{ color: "rgba(240,242,245,0.4)", fontFamily: "var(--font-mono)" }}
                    >
                      {JSON.stringify(rec.original_row)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
