export type DocumentType =
  | "receipt"
  | "discharge_summary"
  | "lab_report"
  | "prescription";

export interface FieldValue {
  value: unknown;       // string | number | object[] | null
  confidence: number;   // 0.0–1.0
}

export interface ExtractionResult {
  document_type: DocumentType;
  confidence: number;
  fields: Record<string, FieldValue>;
  validation_errors: string[];
}

export interface SampleDoc {
  id: string;
  label: string;
  type: DocumentType;
  html: string;
  precomputed: ExtractionResult;
}
