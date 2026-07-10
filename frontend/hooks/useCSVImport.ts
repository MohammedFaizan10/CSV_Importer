"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import {
  CsvPreview,
  ImportResponse,
  ImportSuccessResponse,
  UploadState,
} from "../types/universal";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const PREVIEW_ROW_CAP = 100;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type Phase =
  | "upload" // idle/dragging/file_selected/error - before confirm
  | "processing" // network request in flight
  | "results" // success response rendered
  | "failed"; // network/server-level failure, distinct from per-row skips

interface UseCSVImportReturn {
  phase: Phase;
  uploadState: UploadState;
  file: File | null;
  preview: CsvPreview | null;
  errorMessage: string | null;
  result: ImportSuccessResponse | null;
  handleFileSelected: (file: File) => void;
  handleRemoveFile: () => void;
  setDragging: (dragging: boolean) => void;
  confirmImport: (mode?: "universal" | "crm") => Promise<void>;
  reset: () => void;
}

export function useCSVImport(): UseCSVImportReturn {
  const [phase, setPhase] = useState<Phase>("upload");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImportSuccessResponse | null>(null);
  const submittingRef = useRef(false);

  const showError = useCallback((message: string) => {
    setUploadState("error");
    setErrorMessage(message);
    setFile(null);
    setPreview(null);
  }, []);

  const setDragging = useCallback(
    (dragging: boolean) => {
      if (uploadState === "file_selected") return;
      setUploadState(dragging ? "dragging" : "idle");
    },
    [uploadState]
  );

  const handleFileSelected = useCallback(
    (selected: File) => {
      if (!selected.name.toLowerCase().endsWith(".csv")) {
        showError("Only .csv files are supported.");
        return;
      }
      if (selected.size > MAX_FILE_SIZE_BYTES) {
        showError("File is too large. Maximum size is 10 MB.");
        return;
      }

      setFile(selected);
      setUploadState("file_selected");
      setErrorMessage(null);
      setPreview(null);

      Papa.parse(selected, {
        header: true,
        skipEmptyLines: true,
        preview: 0, // parse fully to get accurate total row count; we cap rendering ourselves
        complete: (results) => {
          const columns = results.meta.fields ?? [];
          if (columns.length === 0) {
            showError(
              "Could not detect column headers. Please ensure your CSV has a header row."
            );
            return;
          }
          const allRows = results.data as Record<string, string>[];
          if (allRows.length === 0) {
            showError("The uploaded file appears to be empty.");
            return;
          }
          setPreview({
            columns,
            rows: allRows.slice(0, PREVIEW_ROW_CAP),
            totalRowCount: allRows.length,
          });
        },
        error: () => {
          showError(
            "Could not detect column headers. Please ensure your CSV has a header row."
          );
        },
      });
    },
    [showError]
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setUploadState("idle");
    setErrorMessage(null);
  }, []);

  const confirmImport = useCallback(async (mode: "universal" | "crm" = "universal") => {
    if (!file || submittingRef.current) return;
    submittingRef.current = true;
    setPhase("processing");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/import?mode=${mode}`, {
        method: "POST",
        body: formData,
      });

      let body: ImportResponse;
      try {
        body = await response.json();
      } catch {
        setPhase("failed");
        setErrorMessage(
          "Something went wrong on the server. Please try again."
        );
        return;
      }

      if (!response.ok || !body.success) {
        if (response.status >= 500) {
          setErrorMessage("Something went wrong on the server. Please try again.");
        } else if (!body.success && body.message) {
          setErrorMessage(body.message);
        } else {
          setErrorMessage("Something went wrong on the server. Please try again.");
        }
        setPhase("failed");
        return;
      }

      if (body.total_imported === 0 && body.total_rows > 0) {
        setErrorMessage(
          "No valid records could be extracted from the CSV. Please check the file format and try again."
        );
        setPhase("failed");
        return;
      }

      setResult(body);
      setPhase("results");
    } catch {
      setPhase("failed");
      setErrorMessage(
        "Could not reach the server. Please check your connection and try again."
      );
    } finally {
      submittingRef.current = false;
    }
  }, [file]);

  const reset = useCallback(() => {
    setPhase("upload");
    setUploadState("idle");
    setFile(null);
    setPreview(null);
    setErrorMessage(null);
    setResult(null);
    submittingRef.current = false;
  }, []);

  return {
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
  };
}
