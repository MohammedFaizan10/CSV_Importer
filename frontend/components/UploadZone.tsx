"use client";

import { ChangeEvent, DragEvent, useRef } from "react";
import { UploadState } from "../types/universal";

interface UploadZoneProps {
  uploadState: UploadState;
  file: File | null;
  errorMessage: string | null;
  onFileSelected: (file: File) => void;
  onDraggingChange: (dragging: boolean) => void;
  onRemove: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadZone({
  uploadState,
  file,
  errorMessage,
  onFileSelected,
  onDraggingChange,
  onRemove,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDraggingChange(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileSelected(dropped);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileSelected(selected);
    e.target.value = "";
  };

  /* ── File selected state ── */
  if (uploadState === "file_selected" && file) {
    return (
      <div
        className="glass rounded-xl px-5 py-4 flex items-center justify-between gap-4 animate-fade-in"
        style={{ border: "1px solid rgba(200,169,110,0.2)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center font-display font-bold text-xs"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid rgba(200,169,110,0.2)",
              letterSpacing: "0.04em",
            }}
          >
            CSV
          </div>
          <div className="min-w-0">
            <p
              className="font-medium text-sm truncate"
              style={{ color: "var(--ink)" }}
            >
              {file.name}
            </p>
            <p className="text-xs tabular" style={{ color: "var(--muted)" }}>
              {formatBytes(file.size)}
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 text-xs font-medium rounded-lg px-3 py-1.5 transition-all duration-200"
          style={{
            color: "var(--muted)",
            border: "1px solid var(--border)",
            background: "transparent",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(248,113,113,0.3)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          }}
        >
          Remove
        </button>
      </div>
    );
  }

  /* ── Drop zone ── */
  const isDragging = uploadState === "dragging";
  const isError = uploadState === "error";

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); onDraggingChange(true); }}
        onDragLeave={() => onDraggingChange(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        className="rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden"
        style={{
          border: `2px dashed ${isDragging ? "var(--accent)" : isError ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.22)"}`,
          background: isDragging
            ? "rgba(200,169,110,0.12)"
            : "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "60px 40px",
          textAlign: "center",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        }}
        onMouseEnter={e => {
          if (!isDragging && !isError) {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLDivElement).style.background = "rgba(200,169,110,0.08)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px 0 var(--accent-glow)";
          }
        }}
        onMouseLeave={e => {
          if (!isDragging && !isError) {
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.22)";
            (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px 0 rgba(0, 0, 0, 0.37)";
          }
        }}
      >
        {/* Subtle corner accents */}
        <div
          className="absolute top-0 left-0 w-6 h-6 pointer-events-none"
          style={{
            borderTop: "1px solid var(--accent)",
            borderLeft: "1px solid var(--accent)",
            opacity: isDragging ? 1 : 0.3,
            transition: "opacity 0.3s",
          }}
        />
        <div
          className="absolute top-0 right-0 w-6 h-6 pointer-events-none"
          style={{
            borderTop: "1px solid var(--accent)",
            borderRight: "1px solid var(--accent)",
            opacity: isDragging ? 1 : 0.3,
            transition: "opacity 0.3s",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none"
          style={{
            borderBottom: "1px solid var(--accent)",
            borderLeft: "1px solid var(--accent)",
            opacity: isDragging ? 1 : 0.3,
            transition: "opacity 0.3s",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none"
          style={{
            borderBottom: "1px solid var(--accent)",
            borderRight: "1px solid var(--accent)",
            opacity: isDragging ? 1 : 0.3,
            transition: "opacity 0.3s",
          }}
        />

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Upload icon */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{
              background: isDragging ? "var(--accent-dim)" : "rgba(255,255,255,0.04)",
              border: "1px solid",
              borderColor: isDragging ? "rgba(200,169,110,0.3)" : "rgba(255,255,255,0.08)",
              color: isDragging ? "var(--accent)" : "var(--muted)",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <p
              className="font-display font-semibold text-base mb-1"
              style={{ color: "var(--ink)", letterSpacing: "-0.01em" }}
            >
              {isDragging ? "Release to upload" : "Drop any CSV file here"}
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              or{" "}
              <span style={{ color: "var(--accent)" }}>
                click to browse
              </span>
              {" "}· up to 10 MB
            </p>
          </div>
        </div>
      </div>

      {isError && errorMessage && (
        <p
          className="mt-2.5 text-sm flex items-center gap-1.5"
          style={{ color: "var(--danger)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
