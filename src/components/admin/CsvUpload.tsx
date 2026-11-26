"use client";

import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { CsvImportSummary } from "@/types/database.types";
import { Button, Notice, api } from "@/components/ui";

/**
 * File picker that posts a CSV to `endpoint` and shows the result.
 */
export function CsvUpload({
  endpoint,
  buttonLabel,
  onDone,
}: {
  endpoint: string;
  buttonLabel: string;
  onDone?: (summary: CsvImportSummary) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CsvImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api<{ data: CsvImportSummary }>(endpoint, {
        method: "POST",
        json: { csvText: await file.text() },
      });
      setResult(res.data);
      onDone?.(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
      <Button variant="secondary" className="w-full sm:w-auto" loading={busy} onClick={() => ref.current?.click()}>
        {!busy && <Upload className="w-4 h-4" />}
        {busy ? "Uploading" : buttonLabel}
      </Button>

      {error && <Notice tone="error">{error}</Notice>}
      {result && (
        <Notice tone={result.errors.length ? "warning" : "success"}>
          <div>
            {result.importedCount} of {result.totalRows} rows saved
            {typeof result.linkedMembersCount === "number" &&
              `; ${result.linkedMembersCount} matched to association members`}
            .
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-xs">
              {result.errors.slice(0, 5).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </Notice>
      )}
    </div>
  );
}
