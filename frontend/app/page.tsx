"use client";

import { useState } from "react";
import { useCSVImport } from "../hooks/useCSVImport";
import UploadZone from "../components/UploadZone";
import PreviewTable from "../components/PreviewTable";
import ResultsTable from "../components/ResultsTable";
import SkippedTable from "../components/SkippedTable";
import SummaryBar from "../components/SummaryBar";
import ThemeToggle from "../components/ThemeToggle";
import FloatingBackground from "../components/FloatingBackground";

export default function Home() {
  const {
    phase,
    uploadState,
    file,
    preview,
    errorMessage,
    result,
    handleFileSelected,
    handleRemoveFile,
    setDragging,
    confirmImport,
    reset,
  } = useCSVImport();

  const [importMode, setImportMode] = useState<"universal" | "crm">("crm");

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Floating interactive background shapes */}
      <FloatingBackground />

      {/* Ambient background orbs */}
      <div
        className="orb"
        style={{
          width: 600,
          height: 600,
          top: -200,
          left: -200,
          background: "radial-gradient(circle, rgba(200,169,110,0.07) 0%, transparent 70%)",
        }}
      />
      <div
        className="orb"
        style={{
          width: 500,
          height: 500,
          bottom: -150,
          right: -100,
          background: "radial-gradient(circle, rgba(200,169,110,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "var(--glass)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          borderBottom: "2px solid var(--accent)",
          boxShadow: "0 4px 20px 0 var(--accent-glow)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="animate-fade-in flex items-center gap-3">
            {/* Logo mark */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, #d4af37 100%)",
                color: "#08090b",
                letterSpacing: "0.02em",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              GE
            </div>
            <div>
              <p
                className="font-display font-semibold text-lg tracking-tight gradient-text"
                style={{ letterSpacing: "-0.02em" }}
              >
                GrowEasy Ai powered Csv Importer
              </p>
              <p className="text-xs" style={{ color: "var(--muted)", marginTop: -1 }}>
                Real Estate CRM Data Onboarding Engine
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 flex flex-col gap-8">

        {/* Hero headline — only on upload phase */}
        {phase === "upload" && (
          <div className="animate-fade-up text-center pt-4 pb-2">
            <h1
              className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-3 shimmer-text"
              style={{ letterSpacing: "-0.035em", lineHeight: 1.1 }}
            >
              {importMode === "crm" ? "Import Leads Instantly" : "Import Any CSV Instantly"}
            </h1>
            <p className="text-base max-w-md mx-auto" style={{ color: "var(--muted)" }}>
              {importMode === "crm" 
                ? "Drop your lead CSVs. AI maps to GrowEasy CRM schema (15 fixed fields: name, email, mobile, etc.)" 
                : "Drop any CSV from any source. AI preserves your original columns exactly as they are (dynamic schema)."}
            </p>
            <div className="flex justify-center mt-6 gap-3">
              <button
                onClick={() => setImportMode("crm")}
                className="px-5 py-2 text-xs font-semibold rounded-full border transition-all duration-200"
                style={{
                  background: importMode === "crm" ? "var(--accent)" : "rgba(255,255,255,0.02)",
                  color: importMode === "crm" ? "var(--accent-ink)" : "var(--muted)",
                  borderColor: importMode === "crm" ? "var(--accent)" : "rgba(255,255,255,0.12)",
                }}
              >
                GrowEasy CRM Mode
              </button>
              <button
                onClick={() => setImportMode("universal")}
                className="px-5 py-2 text-xs font-semibold rounded-full border transition-all duration-200"
                style={{
                  background: importMode === "universal" ? "var(--accent)" : "rgba(255,255,255,0.02)",
                  color: importMode === "universal" ? "var(--accent-ink)" : "var(--muted)",
                  borderColor: importMode === "universal" ? "var(--accent)" : "rgba(255,255,255,0.12)",
                }}
              >
                Universal Mode
              </button>
            </div>
          </div>
        )}

        {/* Upload phase */}
        {phase === "upload" && (
          <>
            <div className="animate-fade-up-1">
              <UploadZone
                uploadState={uploadState}
                file={file}
                errorMessage={errorMessage}
                onFileSelected={handleFileSelected}
                onDraggingChange={setDragging}
                onRemove={handleRemoveFile}
              />
            </div>

            {preview && (
              <div className="animate-fade-up-2 flex flex-col gap-5">
                <PreviewTable preview={preview} />

                {/* Confirm bar */}
                <div
                  className="glass rounded-xl px-6 py-4 flex items-center justify-between flex-wrap gap-4"
                >
                  <div>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>Ready to process</p>
                    <p className="font-display font-semibold text-lg" style={{ color: "var(--ink)" }}>
                      <span className="tabular" style={{ color: "var(--accent)" }}>
                        {preview.totalRowCount.toLocaleString()}
                      </span>{" "}
                      rows detected
                    </p>
                  </div>
                  <button
                    onClick={() => confirmImport(importMode)}
                    className="group relative overflow-hidden rounded-lg px-7 py-3 font-display font-semibold text-sm transition-all duration-300"
                    style={{
                      background: "var(--accent)",
                      color: "var(--accent-ink)",
                      letterSpacing: "0.02em",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px var(--accent-glow)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Confirm Import
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Processing phase */}
        {phase === "processing" && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-10">
            {/* Spinner ring */}
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full animate-pulse-glow"
                style={{
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass)",
                  backdropFilter: "blur(12px)",
                }}
              />
              <div
                className="absolute inset-1 rounded-full animate-spin-custom"
                style={{
                  border: "2px solid transparent",
                  borderTopColor: "var(--accent)",
                  borderRightColor: "rgba(200,169,110,0.3)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Text */}
            <div className="text-center">
              <p
                className="font-display font-semibold text-xl mb-2 shimmer-text"
                style={{ letterSpacing: "-0.02em" }}
              >
                AI is mapping your data
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Analysing columns, normalising values, and structuring records…
              </p>
            </div>

            {/* Progress bar */}
            <div
              className="w-64 h-0.5 rounded-full overflow-hidden"
              style={{ background: "var(--glass-border)" }}
            >
              <div
                className="h-full rounded-full animate-progress"
                style={{ background: "linear-gradient(90deg, var(--accent), rgba(200,169,110,0.5))" }}
              />
            </div>
          </div>
        )}

        {/* Failed phase */}
        {phase === "failed" && (
          <div className="animate-fade-up flex flex-col items-center text-center py-16 gap-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "var(--danger-dim)", border: "1px solid rgba(248,113,113,0.2)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="font-display font-semibold text-lg mb-1" style={{ color: "var(--danger)" }}>
                Import Failed
              </p>
              <p className="text-sm max-w-sm" style={{ color: "var(--muted)" }}>
                {errorMessage ?? "Something went wrong. Please try again."}
              </p>
            </div>
            <button
              onClick={reset}
              className="glass rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200"
              style={{ color: "var(--ink)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results phase */}
        {phase === "results" && result && (
          <div className="flex flex-col gap-8">
            <div className="animate-fade-up">
              <SummaryBar
                totalRows={result.total_rows}
                totalImported={result.total_imported}
                totalSkipped={result.total_skipped}
              />
            </div>

            <section className="animate-fade-up-1 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2
                  className="font-display font-semibold text-base tracking-tight"
                  style={{ color: "var(--ink)", letterSpacing: "-0.01em" }}
                >
                  Imported Records
                </h2>
                <span
                  className="tabular text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "var(--success-dim)", color: "var(--success)" }}
                >
                  {result.total_imported.toLocaleString()} records
                </span>
              </div>
              <ResultsTable records={result.imported} />
            </section>

            <section className="animate-fade-up-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2
                  className="font-display font-semibold text-base tracking-tight"
                  style={{ color: "var(--ink)", letterSpacing: "-0.01em" }}
                >
                  Skipped Records
                </h2>
                {result.total_skipped > 0 && (
                  <span
                    className="tabular text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "var(--warning-dim)", color: "var(--warning)" }}
                  >
                    {result.total_skipped.toLocaleString()} skipped
                  </span>
                )}
              </div>
              <SkippedTable records={result.skipped} />
            </section>

            <div className="animate-fade-up-3 pb-8">
              <button
                onClick={reset}
                className="glass rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2"
                style={{ color: "var(--ink)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(200,169,110,0.3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Import Another File
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
