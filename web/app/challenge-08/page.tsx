"use client";

import { useState, useRef } from "react";
import { samples } from "@/lib/challenge-08/samples";
import type { ExtractionResult, DocumentType } from "@/lib/challenge-08/types";
import type { SampleDoc } from "@/lib/challenge-08/types";

const TYPE_COLORS: Record<DocumentType, string> = {
  receipt: "bg-blue-100 text-blue-700",
  discharge_summary: "bg-purple-100 text-purple-700",
  lab_report: "bg-emerald-100 text-emerald-700",
  prescription: "bg-amber-100 text-amber-700",
};

const TYPE_LABELS: Record<DocumentType, string> = {
  receipt: "Receipt",
  discharge_summary: "Discharge Summary",
  lab_report: "Lab Report",
  prescription: "Prescription",
};

const TYPE_ICONS: Record<DocumentType, string> = {
  receipt: "🧾",
  discharge_summary: "🏥",
  lab_report: "🔬",
  prescription: "💊",
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-7 text-right tabular-nums">{pct}%</span>
    </div>
  );
}

function FieldRow({ label, value, confidence }: { label: string; value: unknown; confidence: number }) {
  const display =
    value === null || value === undefined ? (
      <span className="text-gray-300 italic text-xs">null</span>
    ) : typeof value === "object" ? (
      <span className="text-xs font-mono text-gray-500 break-all">{JSON.stringify(value)}</span>
    ) : (
      <span className="font-medium text-gray-800">{String(value)}</span>
    );

  return (
    <div className="grid grid-cols-[140px_1fr_110px] gap-3 items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold truncate">{label}</span>
      <span className="text-sm">{display}</span>
      <ConfidenceBar value={confidence} />
    </div>
  );
}

function ReceiptResults({ fields }: { fields: ExtractionResult["fields"] }) {
  const items = fields.items?.value as Record<string, unknown>[] | null;
  return (
    <div className="space-y-4">
      <div className="space-y-0">
        {["hospital_name", "patient_name", "date", "payment_method"].map(
          k => fields[k] && <FieldRow key={k} label={k} value={fields[k].value} confidence={fields[k].confidence} />
        )}
      </div>
      {Array.isArray(items) && items.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Line Items</p>
          <div className="rounded-lg overflow-hidden border border-gray-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold">
                  <th className="text-left px-3 py-2">Description</th>
                  <th className="text-center px-3 py-2 w-10">Qty</th>
                  <th className="text-right px-3 py-2 w-20">Unit</th>
                  <th className="text-right px-3 py-2 w-20">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-700">{String(item.description ?? "")}</td>
                    <td className="text-center px-3 py-2 text-gray-500">{String(item.quantity ?? "")}</td>
                    <td className="text-right px-3 py-2 text-gray-500">฿{String(item.unit_price ?? "")}</td>
                    <td className="text-right px-3 py-2 font-semibold text-gray-800">฿{String(item.total ?? "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {fields.grand_total && (
        <div className="flex justify-between items-center pt-2 border-t-2 border-gray-200">
          <span className="font-semibold text-sm text-gray-600">Grand Total</span>
          <span className="font-bold text-lg text-gray-900">
            ฿{Number(fields.grand_total.value).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

function DischargeResults({ fields }: { fields: ExtractionResult["fields"] }) {
  const procedures = fields.procedures_performed?.value as string[] | null;
  const diagnosis = fields.diagnosis?.value as Record<string, unknown> | null;
  return (
    <div className="space-y-4">
      <div className="space-y-0">
        {["hospital_name", "patient_name", "admission_date", "discharge_date", "attending_physician"].map(
          k => fields[k] && <FieldRow key={k} label={k} value={fields[k].value} confidence={fields[k].confidence} />
        )}
      </div>
      {diagnosis && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Diagnosis</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <div className="flex gap-2">
              <span className="text-xs font-semibold text-gray-400 w-16 shrink-0">Primary</span>
              <span className="text-sm text-gray-800">{String(diagnosis.primary ?? "—")}</span>
            </div>
            {diagnosis.secondary != null && (
              <div className="flex gap-2">
                <span className="text-xs font-semibold text-gray-400 w-16 shrink-0">Secondary</span>
                <span className="text-sm text-gray-700">{String(diagnosis.secondary)}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {Array.isArray(procedures) && procedures.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Procedures</p>
          <ul className="space-y-1">
            {procedures.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-gray-300 mt-0.5">▸</span>{p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {fields.discharge_instructions && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Instructions</p>
          <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 leading-relaxed">
            {String(fields.discharge_instructions.value)}
          </p>
        </div>
      )}
    </div>
  );
}

function LabResults({ fields }: { fields: ExtractionResult["fields"] }) {
  const tests = fields.tests?.value as Record<string, unknown>[] | null;
  const flagStyle = (flag: unknown) => {
    if (flag === "critical") return "bg-red-200 text-red-800";
    if (flag === "high") return "bg-orange-100 text-orange-700";
    if (flag === "low") return "bg-blue-100 text-blue-700";
    return "bg-emerald-100 text-emerald-700";
  };
  return (
    <div className="space-y-4">
      <div className="space-y-0">
        {["lab_name", "patient_name", "date"].map(
          k => fields[k] && <FieldRow key={k} label={k} value={fields[k].value} confidence={fields[k].confidence} />
        )}
      </div>
      {Array.isArray(tests) && tests.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Test Results</p>
          <div className="rounded-lg overflow-hidden border border-gray-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold">
                  <th className="text-left px-3 py-2">Test</th>
                  <th className="text-right px-3 py-2">Result</th>
                  <th className="text-right px-3 py-2 hidden sm:table-cell">Reference</th>
                  <th className="text-center px-3 py-2 w-20">Flag</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {tests.map((t, i) => (
                  <tr key={i} className={t.flag === "high" || t.flag === "critical" ? "bg-red-50/40" : t.flag === "low" ? "bg-blue-50/40" : ""}>
                    <td className="px-3 py-2 font-medium text-gray-700">{String(t.test_name ?? "")}</td>
                    <td className="text-right px-3 py-2 font-semibold text-gray-800">
                      {String(t.result ?? "")} <span className="font-normal text-gray-400">{String(t.unit ?? "")}</span>
                    </td>
                    <td className="text-right px-3 py-2 text-gray-400 hidden sm:table-cell">{String(t.reference_range ?? "")}</td>
                    <td className="text-center px-3 py-2">
                      {t.flag != null && (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${flagStyle(t.flag)}`}>
                          {String(t.flag).toUpperCase()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PrescriptionResults({ fields }: { fields: ExtractionResult["fields"] }) {
  const meds = fields.medications?.value as Record<string, unknown>[] | null;
  return (
    <div className="space-y-4">
      <div className="space-y-0">
        {["doctor_name", "patient_name", "date"].map(
          k => fields[k] && <FieldRow key={k} label={k} value={fields[k].value} confidence={fields[k].confidence} />
        )}
      </div>
      {Array.isArray(meds) && meds.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Medications</p>
          <div className="space-y-2">
            {meds.map((m, i) => (
              <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 flex gap-3 items-start">
                <span className="text-lg mt-0.5">💊</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800">{String(m.name ?? "")}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[m.dosage, m.frequency, m.duration, m.quantity ? `Qty: ${m.quantity}` : null]
                      .filter(Boolean)
                      .map(String)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultPanel({ result }: { result: ExtractionResult }) {
  const [view, setView] = useState<"formatted" | "json">("formatted");
  const [copied, setCopied] = useState(false);

  function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      {/* Doc type + confidence header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{TYPE_ICONS[result.document_type]}</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${TYPE_COLORS[result.document_type]}`}>
            {TYPE_LABELS[result.document_type]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Confidence</span>
          <div className="w-28">
            <ConfidenceBar value={result.confidence} />
          </div>
        </div>
      </div>

      {/* Validation warnings */}
      {result.validation_errors?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5">Validation Warnings</p>
          <ul className="space-y-1">
            {result.validation_errors.map((e, i) => (
              <li key={i} className="text-sm text-amber-800 flex gap-2">
                <span className="shrink-0">⚠</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* View tabs */}
      <div className="flex items-center justify-between border-b border-gray-100">
        <div className="flex gap-0">
          {(["formatted", "json"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                view === v
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {v === "formatted" ? "Formatted" : "JSON"}
            </button>
          ))}
        </div>
        {view === "json" && (
          <button
            onClick={copyJson}
            className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors mb-1"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        )}
      </div>

      {/* Content */}
      {view === "formatted" && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          {result.document_type === "receipt" && <ReceiptResults fields={result.fields} />}
          {result.document_type === "discharge_summary" && <DischargeResults fields={result.fields} />}
          {result.document_type === "lab_report" && <LabResults fields={result.fields} />}
          {result.document_type === "prescription" && <PrescriptionResults fields={result.fields} />}
        </div>
      )}

      {view === "json" && (
        <pre className="bg-gray-950 text-gray-100 text-xs rounded-xl p-4 overflow-auto max-h-[520px] leading-relaxed">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Challenge08Page() {
  const [mode, setMode] = useState<"upload" | "samples">("upload");
  const [selectedSample, setSelectedSample] = useState<SampleDoc>(samples[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Only PNG, JPEG, and WEBP images are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setSelectedFile(file);
    setError(null);
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleSampleSelect(s: SampleDoc) {
    setSelectedSample(s);
    setResult(s.precomputed);
    setError(null);
  }

  function switchMode(m: "upload" | "samples") {
    setMode(m);
    setResult(m === "samples" ? selectedSample.precomputed : null);
    setError(null);
  }

  async function handleExtract() {
    setError(null);
    setResult(null);

    if (mode === "samples") {
      setResult(selectedSample.precomputed);
      return;
    }

    if (!selectedFile) {
      setError("Please select an image file first.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const res = await fetch("/api/challenge-08/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      setResult(data as ExtractionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const typeGroups = Object.entries(
    samples.reduce<Record<string, SampleDoc[]>>((acc, s) => {
      const g = TYPE_LABELS[s.type];
      (acc[g] ??= []).push(s);
      return acc;
    }, {})
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🏥</span>
            <h1 className="text-2xl font-bold text-gray-900">Medical Document Extractor</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
              Advanced · 4–6h
            </span>
          </div>
          <p className="text-gray-400 text-sm ml-11">
            Vision-based LLM pipeline — extract structured data from medical documents for insurance claims.
          </p>
        </div>

        <div className="grid grid-cols-[2fr_3fr] gap-6 items-start">
          {/* LEFT */}
          <div className="space-y-3">
            {/* Mode toggle: Upload first */}
            <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1">
              {(["upload", "samples"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === m
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {m === "upload" ? "⬆ Upload" : "📄 Samples"}
                </button>
              ))}
            </div>

            {/* Upload mode */}
            {mode === "upload" && (
              <div className="space-y-3">
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                    dragOver
                      ? "border-blue-400 bg-blue-50 scale-[1.01]"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  <p className="text-4xl mb-3">🖼</p>
                  <p className="text-sm font-semibold text-gray-600">Drop image here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">PNG · JPEG · WEBP · max 10MB</p>
                </div>

                {previewUrl && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Selected document" className="w-full object-contain max-h-56" />
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-500 truncate max-w-[70%]">{selectedFile?.name}</span>
                      <button
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); setResult(null); }}
                        className="text-xs text-red-400 hover:text-red-600 font-medium shrink-0"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Samples mode */}
            {mode === "samples" && (
              <div className="space-y-3">
                {/* Sample list */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {typeGroups.map(([group, docs], gi) => (
                    <div key={group}>
                      {gi > 0 && <div className="border-t border-gray-100" />}
                      <div className="px-3 pt-2.5 pb-1">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">{group}</p>
                      </div>
                      {docs.map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleSampleSelect(s)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            selectedSample.id === s.id
                              ? "bg-blue-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-lg shrink-0">{TYPE_ICONS[s.type]}</span>
                          <span className={`text-sm font-medium ${selectedSample.id === s.id ? "text-blue-700" : "text-gray-700"}`}>
                            {s.label}
                          </span>
                          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                            selectedSample.id === s.id ? "bg-blue-100 text-blue-600" : "text-gray-300"
                          }`}>
                            {s.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Preview</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[selectedSample.type]}`}>
                      {TYPE_LABELS[selectedSample.type]}
                    </span>
                  </div>
                  <iframe
                    srcDoc={selectedSample.html}
                    className="w-full block"
                    style={{ height: 220, border: "none" }}
                    title="Document preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}

            {/* Extract button */}
            <button
              onClick={handleExtract}
              disabled={loading || (mode === "upload" && !selectedFile)}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? "Analyzing…"
                : mode === "samples"
                ? `Extract ${selectedSample.id}`
                : "Extract Document"}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* RIGHT: Results */}
          <div className="min-h-64">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 text-sm font-medium">Analyzing document…</p>
                  <p className="text-gray-400 text-xs mt-1">via Gemini 2.0 Flash · OpenRouter</p>
                </div>
              </div>
            )}

            {!loading && result && <ResultPanel result={result} />}

            {!loading && !result && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center text-gray-300">
                  <p className="text-5xl mb-4">📋</p>
                  <p className="text-sm font-semibold text-gray-400">No results yet</p>
                  <p className="text-xs text-gray-300 mt-1">
                    {mode === "samples"
                      ? "Select a sample and click Extract"
                      : "Upload an image and click Extract"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
