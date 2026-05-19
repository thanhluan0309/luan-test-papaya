"use client";

import { useState } from "react";
import { CASES } from "@/lib/challenge-11/cases";
import type { AgentResult, AssessmentReport, ToolCallLog } from "@/lib/challenge-11/types";

const VERDICT_STYLE: Record<AssessmentReport["recommendation"], string> = {
  APPROVE:           "bg-emerald-50 border-emerald-300 text-emerald-800",
  REJECT:            "bg-red-50 border-red-300 text-red-800",
  REQUEST_MORE_INFO: "bg-amber-50 border-amber-300 text-amber-800",
};

const VERDICT_ICON: Record<AssessmentReport["recommendation"], string> = {
  APPROVE: "✅", REJECT: "❌", REQUEST_MORE_INFO: "📋",
};

const TOOL_COLOR: Record<string, string> = {
  lookupPolicy:          "bg-blue-100 text-blue-700",
  calculateBenefit:      "bg-emerald-100 text-emerald-700",
  verifyDocument:        "bg-purple-100 text-purple-700",
  checkMedicalNecessity: "bg-amber-100 text-amber-700",
};

const STEP_MESSAGES = [
  "Verifying submitted documents…",
  "Looking up policy terms…",
  "Checking medical necessity…",
  "Calculating benefits…",
  "Writing assessment report…",
];

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

function ToolLogItem({ log, index }: { log: ToolCallLog; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{index + 1}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${TOOL_COLOR[log.tool] ?? "bg-gray-100 text-gray-600"}`}>
          {log.tool}
        </span>
        <span className="text-xs text-gray-500 truncate flex-1">
          {Object.entries(log.input).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")}
        </span>
        <span className="text-gray-300 text-xs">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 space-y-2">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Input</p>
            <pre className="text-xs bg-white rounded p-2 border border-gray-100 overflow-auto max-h-32">
              {JSON.stringify(log.input, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Output</p>
            <pre className="text-xs bg-white rounded p-2 border border-gray-100 overflow-auto max-h-40">
              {JSON.stringify(log.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <span>{icon}</span>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function ReportView({ report }: { report: AssessmentReport }) {
  return (
    <div className="space-y-3">
      {/* Verdict banner */}
      <div className={`border-2 rounded-xl p-4 ${VERDICT_STYLE[report.recommendation]}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{VERDICT_ICON[report.recommendation]}</span>
          <div>
            <p className="font-bold text-lg">{report.recommendation.replace(/_/g, " ")}</p>
            <p className="text-sm mt-0.5 opacity-80">{report.reasoning}</p>
          </div>
        </div>
      </div>

      {/* 1. Document Review */}
      <ReportSection title="Document Review" icon="📄">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 font-semibold uppercase tracking-wide">
              <th className="text-left pb-1.5">Document</th>
              <th className="text-left pb-1.5">Type</th>
              <th className="text-left pb-1.5">Status</th>
              <th className="text-left pb-1.5">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {report.document_review.map((d, i) => (
              <tr key={i}>
                <td className="py-1.5 font-mono text-gray-600">{d.doc_id}</td>
                <td className="py-1.5 text-gray-600">{d.type}</td>
                <td className="py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                    d.status === "complete" ? "bg-emerald-100 text-emerald-700" :
                    d.status === "incomplete" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="py-1.5 text-gray-500">{d.issues.join("; ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportSection>

      {/* 2. Policy Verification */}
      <ReportSection title="Policy Verification" icon="🛡">
        <div className="flex flex-wrap gap-2 mb-2">
          <StatusBadge ok={report.policy_verification.active} label="Policy Active" />
          <StatusBadge ok={report.policy_verification.member_covered} label="Member Covered" />
          <StatusBadge ok={report.policy_verification.claim_type_covered} label="Claim Type Covered" />
          <StatusBadge ok={report.policy_verification.within_limit} label="Within Limit" />
        </div>
        {report.policy_verification.notes && (
          <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">{report.policy_verification.notes}</p>
        )}
      </ReportSection>

      {/* 3. Medical Necessity */}
      <ReportSection title="Medical Necessity" icon="🩺">
        <div className="flex items-start gap-3">
          <StatusBadge ok={report.medical_necessity.appropriate} label={report.medical_necessity.appropriate ? "Appropriate" : "Not Appropriate"} />
          <p className="text-xs text-gray-600 leading-relaxed">{report.medical_necessity.reasoning}</p>
        </div>
      </ReportSection>

      {/* 4. Benefit Calculation */}
      <ReportSection title="Benefit Calculation" icon="💰">
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Submitted", report.benefit_calculation.submitted],
            ["Covered",   report.benefit_calculation.covered],
            ["Co-pay",    report.benefit_calculation.copay],
            ["Member Pays", report.benefit_calculation.member_pays],
          ].map(([label, val]) => (
            <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
              <p className="text-base font-bold text-gray-800 mt-0.5">
                ฿{(val as number).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* 5. Policy Citations */}
      {report.policy_citations?.length > 0 && (
        <ReportSection title="Policy Citations" icon="📎">
          <ol className="space-y-1">
            {report.policy_citations.map((c, i) => (
              <li key={i} className="text-xs text-gray-700 flex gap-2">
                <span className="text-gray-400 font-bold shrink-0">{i + 1}.</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </ReportSection>
      )}
    </div>
  );
}

const EXPECTED_STYLE: Record<string, string> = {
  APPROVE:           "bg-emerald-100 text-emerald-700",
  REJECT:            "bg-red-100 text-red-700",
  REQUEST_MORE_INFO: "bg-amber-100 text-amber-700",
};

export default function Challenge11Page() {
  const [selectedCase, setSelectedCase] = useState(CASES[0]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setResult(null);
    setError(null);
    setStepIdx(0);

    // Animate step messages while waiting
    const interval = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, STEP_MESSAGES.length - 1));
    }, 1800);

    try {
      const res = await fetch("/api/challenge-11/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: selectedCase.case_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Agent failed");
      setResult(data as AgentResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  const verdict = result?.report.recommendation;
  const pass = verdict === selectedCase.expected;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🤖</span>
            <h1 className="text-2xl font-bold text-gray-900">Claim Assessment AI Agent</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
              Advanced · 6–8h
            </span>
          </div>
          <p className="text-gray-400 text-sm ml-11">
            Agentic loop with 4 tools — assess claims and produce structured reports in minutes.
          </p>
        </div>

        {/* Case selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CASES.map(c => (
            <button
              key={c.case_id}
              onClick={() => { setSelectedCase(c); setResult(null); setError(null); }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selectedCase.case_id === c.case_id
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{c.case_id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${EXPECTED_STYLE[c.expected]}`}>
                  {c.expected.replace(/_/g, " ")}
                </span>
              </div>
              <p className="font-semibold text-sm text-gray-800 mb-1">{c.label}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{c.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {c.claim.claim_type}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  ฿{c.claim.submitted_amount.toLocaleString()}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {c.claim.documents.length} docs
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Running agent…" : `Run Agent Assessment — ${selectedCase.label}`}
        </button>

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium text-sm">{STEP_MESSAGES[stepIdx]}</p>
            <p className="text-xs text-gray-400 mt-1">Agent is calling tools via Gemini 2.0 Flash · OpenRouter</p>
            <div className="flex justify-center gap-1.5 mt-4">
              {STEP_MESSAGES.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= stepIdx ? "bg-blue-400" : "bg-gray-200"}`} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && result && (
          <div>
            {/* Pass/fail badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${pass ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-red-50 border-red-300 text-red-700"}`}>
                {pass ? "✓ Expected outcome matched" : `✗ Expected ${selectedCase.expected}, got ${verdict}`}
              </span>
              <span className="text-xs text-gray-400">{result.tool_logs.length} tool calls made</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
              {/* Tool call log */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Tool Call Log</p>
                <div className="space-y-1.5">
                  {result.tool_logs.map((log, i) => (
                    <ToolLogItem key={i} log={log} index={i} />
                  ))}
                </div>
              </div>

              {/* Report */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Assessment Report</p>
                <ReportView report={result.report} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
