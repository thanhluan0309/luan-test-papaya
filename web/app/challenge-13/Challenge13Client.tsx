"use client";

import { useState, useRef } from "react";
import { InsuranceSDK, ValidationError, AuthError, NetworkError, ApiError } from "@/lib/challenge-13/sdk/index";
import type { ClaimType, DocumentType } from "@/lib/challenge-13/sdk/types";

type LogEntry = {
  ts: string;
  type: "info" | "success" | "error" | "retry" | "status";
  text: string;
};

type Tab = "demo" | "explorer";

const STATUS_BADGE: Record<string, string> = {
  PENDING:    "bg-gray-100 text-gray-600",
  PROCESSING: "bg-blue-100 text-blue-700",
  APPROVED:   "bg-emerald-100 text-emerald-700",
  REJECTED:   "bg-red-100 text-red-700",
};

const CLAIM_TYPES: ClaimType[] = ["OUTPATIENT", "INPATIENT", "DENTAL", "MATERNITY", "SPECIALIST"];
const DOC_TYPES: DocumentType[] = ["medical_receipt", "discharge_summary", "prescription", "referral_letter", "id_card_copy"];

function sdkInstance() {
  return new InsuranceSDK({
    apiKey: "pk_test_demo",
    environment: "sandbox",
    baseUrl: "/api/challenge-13/v1",
    maxRetries: 3,
    retryBaseDelay: 300,
  });
}

function now() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

// ── Live Demo Tab ─────────────────────────────────────────────────────────────

function DemoTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  function log(type: LogEntry["type"], text: string) {
    setLogs(prev => [...prev, { ts: now(), type, text }]);
  }

  async function run() {
    setLogs([]);
    setRunning(true);
    const sdk = sdkInstance();

    // Patch fetch to detect retries
    const origFetch = globalThis.fetch;
    let lastUrl = "";
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url === lastUrl && !url.includes("/auth/token")) {
        log("retry", `Retrying request to ${url.split("/").pop()}…`);
      }
      lastUrl = url;
      return origFetch(input, init);
    };

    try {
      log("info", "Authenticating with API key pk_test_demo…");
      const claim = await sdk.claims.create({
        policyId: "POL-DEMO",
        claimType: "OUTPATIENT",
        diagnosisCode: "J06.9",
        treatmentDate: new Date().toISOString().slice(0, 10),
        amount: 12500,
        currency: "THB",
      });
      log("success", `Claim created: ${claim.id}  (status=${claim.status})`);
      log("info", "Watching for status changes…");

      await new Promise<void>(resolve => {
        unsubRef.current = sdk.claims.onStatusChange(
          claim.id,
          (status, updated) => {
            log("status", `Status → ${status}  (id=${updated.id})`);
            if (status === "APPROVED" || status === "REJECTED") {
              unsubRef.current?.();
              resolve();
            }
          },
          2000,
        );
      });

      log("success", "Demo complete.");
    } catch (err) {
      if (err instanceof ValidationError) log("error", `Validation: ${JSON.stringify(err.fields)}`);
      else if (err instanceof AuthError)  log("error", `Auth: ${err.message}`);
      else if (err instanceof NetworkError) log("error", `Network: ${err.message}`);
      else if (err instanceof ApiError)   log("error", `API ${err.statusCode}: ${err.message}`);
      else log("error", String(err));
    } finally {
      globalThis.fetch = origFetch;
      setRunning(false);
    }
  }

  function stop() {
    unsubRef.current?.();
    unsubRef.current = null;
    setRunning(false);
    log("info", "Stopped.");
  }

  const LOG_STYLE: Record<LogEntry["type"], string> = {
    info:    "text-gray-500",
    success: "text-emerald-600 font-medium",
    error:   "text-red-500 font-medium",
    retry:   "text-amber-600 font-medium",
    status:  "text-blue-600 font-semibold",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Creates a claim, then polls for status changes. Watch PENDING → PROCESSING → APPROVED in ~15 seconds.
        Amber lines indicate retry events when the mock server returns 503.
      </p>

      <div className="flex gap-2">
        <button
          onClick={run}
          disabled={running}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {running ? "Running…" : "Run Demo"}
        </button>
        {running && (
          <button
            onClick={stop}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Stop
          </button>
        )}
        {logs.length > 0 && !running && (
          <button
            onClick={() => setLogs([])}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {logs.length > 0 && (
        <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs space-y-1 max-h-80 overflow-y-auto">
          {logs.map((l, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-gray-600 shrink-0">{l.ts}</span>
              <span className={LOG_STYLE[l.type]}>{l.text}</span>
            </div>
          ))}
          {running && (
            <div className="flex gap-3">
              <span className="text-gray-600">{now()}</span>
              <span className="text-gray-500 animate-pulse">…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Explorer Tab ──────────────────────────────────────────────────────────────

function ExplorerTab() {
  const [form, setForm] = useState({
    policyId: "POL-001",
    claimType: "OUTPATIENT" as ClaimType,
    diagnosisCode: "J06.9",
    treatmentDate: new Date().toISOString().slice(0, 10),
    amount: "15000",
    currency: "THB",
  });
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocumentType>("medical_receipt");
  const [docResult, setDocResult] = useState<unknown>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);
    setClaimId(null);
    try {
      const sdk = sdkInstance();
      const claim = await sdk.claims.create({
        ...form,
        amount: Number(form.amount),
      });
      setResult(claim);
      setClaimId(claim.id);
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(`Validation: ${JSON.stringify(err.fields, null, 2)}`);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  async function uploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    if (!claimId || !e.target.files?.[0]) return;
    setDocLoading(true);
    setDocResult(null);
    setProgress(0);
    try {
      const sdk = sdkInstance();
      const doc = await sdk.documents.upload(claimId, e.target.files[0], {
        type: docType,
        onProgress: setProgress,
      });
      setDocResult(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDocLoading(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Claim form */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Create Claim</h3>
        <div className="grid grid-cols-2 gap-3">
          {(["policyId", "diagnosisCode", "currency"] as const).map(field => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1">{field}</label>
              <input
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-500 mb-1">claimType</label>
            <select
              value={form.claimType}
              onChange={e => setForm(f => ({ ...f, claimType: e.target.value as ClaimType }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {CLAIM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">treatmentDate</label>
            <input
              type="date"
              value={form.treatmentDate}
              onChange={e => setForm(f => ({ ...f, treatmentDate: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <button
          onClick={submit}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "Submitting…" : "Submit Claim"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 font-mono whitespace-pre-wrap">
          {error}
        </div>
      )}

      {result != null && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-800">{(result as { id: string }).id}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_BADGE[(result as { status: string }).status] ?? ""}`}>
              {(result as { status: string }).status}
            </span>
          </div>
          <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Document upload */}
      {claimId && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Upload Document to {claimId}</h3>
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Document type</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as DocumentType)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <label className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
              {docLoading ? `Uploading ${progress ?? 0}%…` : "Choose file…"}
              <input type="file" className="hidden" onChange={uploadDoc} disabled={docLoading} />
            </label>
          </div>
          {progress !== null && (
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {docResult != null && (
            <pre className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(docResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "demo",     label: "Live Demo"    },
  { id: "explorer", label: "SDK Explorer" },
];

export default function Challenge13Client() {
  const [tab, setTab] = useState<Tab>("demo");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-1">Challenge 13</p>
        <h1 className="text-2xl font-bold text-gray-900">Partner Integration SDK</h1>
        <p className="mt-1 text-sm text-gray-500">
          TypeScript SDK with auto-retry, JWT token refresh, typed errors, and a mock API server.
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "demo"     && <DemoTab />}
        {tab === "explorer" && <ExplorerTab />}
      </div>
    </div>
  );
}
