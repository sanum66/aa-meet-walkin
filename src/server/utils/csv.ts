import {
  AssociationMembershipType,
  CourseType,
  PreRegistrationResponseStatus,
  StreamType,
} from "../constants";

/**
 * RFC-4180 compliant CSV parser that safely handles:
 * - UTF-8 BOM
 * - Leading empty rows before header (like event_pre_registrations.csv)
 * - Quoted fields containing commas and escaped double quotes ("")
 * - Trailing empty columns
 */
export function parseCsvRecords(csvText: string): Record<string, string>[] {
  const cleaned = csvText.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if (ch === "\r" && next === "\n") {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += ch;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  // Skip leading completely empty lines before locating the header row
  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell !== ""));
  if (nonEmptyRows.length < 2) {
    return [];
  }

  const headers = nonEmptyRows[0];
  const records: Record<string, string>[] = [];

  for (let i = 1; i < nonEmptyRows.length; i++) {
    const row = nonEmptyRows[i];
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (!header) continue;
      obj[header] = row[j] ?? "";
    }
    records.push(obj);
  }

  return records;
}

/**
 * Normalizes mobile numbers for storage and last-10-digit matching.
 */
export function normalizeMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const compact = raw.replace(/\s+/g, "").trim();
  if (!compact) return null;
  const digits = compact.replace(/\D/g, "");
  // Indian numbers in any common format -> "+91-XXXXXXXXXX"
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91-${digits}`;
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1)))
    return `+91-${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+91-${digits.slice(2)}`;
  if (digits.length === 13 && digits.startsWith("910")) return `+91-${digits.slice(3)}`;
  return compact.slice(0, 20);
}

/**
 * Extracts normalized digits for resilient lookup across formats like
 * "+91-9597247891", "+91 98451 31096", "08248039920", or "9597247891".
 */
export function extractPhoneDigits(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function normalizeEmail(raw: string | null | undefined): string {
  return (raw || "").trim().toLowerCase();
}

export function normalizeCourseEnum(raw: string | null | undefined): CourseType | null {
  if (!raw) return null;
  const clean = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (clean === "BE" || clean.includes("BACHELOROFENGINEERING")) return "BE";
  if (clean === "ME" || clean.includes("MASTEROFENGINEERING")) return "ME";
  if (clean === "MCA" || clean.includes("MASTEROFCOMPUTERAPPLICATIONS")) return "MCA";
  return null;
}

export function normalizeCourseLabel(raw: string | null | undefined): string | null {
  const mapped = normalizeCourseEnum(raw);
  if (mapped) return mapped;
  const trimmed = (raw || "").trim();
  return trimmed || null;
}

const STREAM_KEYWORDS: [RegExp, StreamType][] = [
  [/\bAUTO\b|AUTOMOBILE/i, "AUTO"],
  [/\bCIVIL\b/i, "CIVIL"],
  [/\bCTRANS\b/i, "CTRANS"],
  [/\bCSE\b|COMPUTER\s*SCIENCE/i, "CSE"],
  [/\bEEE\b|ELECTRICAL\s*(&|AND)?\s*ELECTRONICS/i, "EEE"],
  [/\bECE\b|ELECTRONICS\s*(&|AND)?\s*COMMUNICATION/i, "ECE"],
  [/\bIT\b|INFORMATION\s*TECHNOLOGY/i, "IT"],
  [/\bMECH\b|MECHANICAL/i, "MECH"],
  [/\bSTRUCT\b|STRUCTURAL/i, "STRUCT"],
  [/\bTHERM\b|THERMAL/i, "THERM"],
  [/\bTRANS\b|TRANSPORTATION/i, "TRANS"],
];

export function normalizeStreamEnum(raw: string | null | undefined): StreamType | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  for (const [pattern, code] of STREAM_KEYWORDS) {
    if (pattern.test(trimmed)) return code;
  }
  return null;
}

export function normalizeStreamLabel(raw: string | null | undefined): string | null {
  const mapped = normalizeStreamEnum(raw);
  if (mapped) return mapped;
  const trimmed = (raw || "").trim();
  return trimmed || null;
}

export function normalizeAssociationMembership(
  raw: string | null | undefined
): AssociationMembershipType {
  const clean = (raw || "").trim().toUpperCase().replace(/\s+/g, "_");
  if (clean.includes("PATRON")) return "PATRON_MEMBER";
  if (clean.includes("LIFE")) return "LIFE_MEMBER";
  return "REGISTERED_MEMBER";
}

export function normalizeResponseStatus(
  raw: string | null | undefined
): PreRegistrationResponseStatus {
  const clean = (raw || "").trim().toUpperCase();
  if (clean.includes("NOT")) return "NOT_GOING";
  if (clean.includes("MAY")) return "MAY_BE";
  return "GOING";
}

export function normalizeFoodPreference(raw: string | null | undefined): string {
  const clean = (raw || "").trim().toLowerCase();
  if (!clean) return "Vegetarian";
  if (clean.includes("non")) return "Non-Vegetarian";
  if (clean.includes("vegan")) return "Vegan";
  if (clean.includes("veg")) return "Vegetarian";
  return raw!.trim();
}
