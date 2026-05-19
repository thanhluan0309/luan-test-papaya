import type { ExtractionResult } from "./types";

function getVal(result: ExtractionResult, key: string): unknown {
  return result.fields[key]?.value ?? null;
}

function isValidDate(s: unknown): boolean {
  if (typeof s !== "string" || !s) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

function isPositiveNumber(v: unknown): boolean {
  return typeof v === "number" ? v > 0 : typeof v === "string" ? Number(v) > 0 : false;
}

const VALID_TYPES = ["receipt", "discharge_summary", "lab_report", "prescription"];
const CONFIDENCE_THRESHOLD = 0.35;

export function validate(result: ExtractionResult): string[] {
  const errors: string[] = [];
  const type = result.document_type;

  if (!VALID_TYPES.includes(type))
    errors.push(`document_type: "${type}" is not a recognized medical document type`);

  if (typeof result.confidence === "number" && result.confidence < CONFIDENCE_THRESHOLD)
    errors.push(
      `Low confidence (${Math.round(result.confidence * 100)}%) — document may not be a valid medical record or could not be read clearly`
    );

  if (type === "receipt") {
    const date = getVal(result, "date");
    if (date !== null && !isValidDate(date))
      errors.push(`date: "${date}" is not a valid date`);

    const grand = getVal(result, "grand_total");
    if (grand !== null && !isPositiveNumber(grand))
      errors.push(`grand_total: must be a positive number`);

    const items = getVal(result, "items");
    if (Array.isArray(items) && typeof grand === "number" && grand > 0) {
      const sum = items.reduce((s: number, item: unknown) => {
        const i = item as Record<string, unknown>;
        return s + (typeof i.total === "number" ? i.total : Number(i.total) || 0);
      }, 0);
      const pctDiff = Math.abs(sum - grand) / grand;
      if (pctDiff > 0.05)
        errors.push(`Items sum (฿${sum.toLocaleString()}) differs from grand_total (฿${grand.toLocaleString()}) by ${(pctDiff * 100).toFixed(1)}%`);
    }
  }

  if (type === "discharge_summary") {
    const adm = getVal(result, "admission_date");
    const dis = getVal(result, "discharge_date");
    if (adm !== null && !isValidDate(adm))
      errors.push(`admission_date: "${adm}" is not a valid date`);
    if (dis !== null && !isValidDate(dis))
      errors.push(`discharge_date: "${dis}" is not a valid date`);
    if (isValidDate(adm) && isValidDate(dis) && new Date(adm as string) > new Date(dis as string))
      errors.push(`admission_date cannot be after discharge_date`);
  }

  if (type === "lab_report") {
    const date = getVal(result, "date");
    if (date !== null && !isValidDate(date))
      errors.push(`date: "${date}" is not a valid date`);

    const tests = getVal(result, "tests");
    if (Array.isArray(tests)) {
      tests.forEach((t: unknown, i: number) => {
        const test = t as Record<string, unknown>;
        const flag = test.flag;
        if (flag != null && !["normal", "high", "low", "critical"].includes(String(flag)))
          errors.push(`tests[${i}].flag: "${flag}" is not valid (expected normal/high/low/critical)`);
      });
    }
  }

  if (type === "prescription") {
    const date = getVal(result, "date");
    if (date !== null && !isValidDate(date))
      errors.push(`date: "${date}" is not a valid date`);
  }

  return errors;
}
