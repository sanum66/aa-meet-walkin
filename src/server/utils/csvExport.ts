/**
 * Builds an RFC-4180 CSV string. Values that a spreadsheet would treat as a
 * formula (=, +, -, @) are prefixed with an apostrophe to prevent CSV injection.
 */
export function toCsv(
  columns: { header: string; value: (row: never) => unknown }[],
  rows: unknown[]
): string {
  const escape = (raw: unknown): string => {
    if (raw === null || raw === undefined) return "";
    let text = String(raw);
    if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) {
      text = `'${text}`;
    }
    if (/[",\r\n]/.test(text)) {
      text = `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [columns.map((c) => escape(c.header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => escape(c.value(row as never))).join(","));
  }
  // BOM so Excel opens UTF-8 names correctly
  return "﻿" + lines.join("\r\n") + "\r\n";
}
