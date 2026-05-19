"use client";

import { useState } from "react";
import { validateClaim } from "@/lib/challenge-12/engine";
import { diffCountries } from "@/lib/challenge-12/diff";
import { TEST_CLAIMS } from "@/lib/challenge-12/claims";
import type { ComplianceReport, CountryConfig, RuleDiff, RuleType } from "@/lib/challenge-12/types";

const STATUS_STYLE: Record<string, string> = {
  COMPLIANT:           "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300",
  PARTIALLY_COMPLIANT: "bg-amber-50 text-amber-700 ring-1 ring-amber-300",
  NON_COMPLIANT:       "bg-red-50 text-red-700 ring-1 ring-red-300",
};

const RULE_STATUS_STYLE: Record<string, string> = {
  PASS: "bg-emerald-100 text-emerald-700",
  FAIL: "bg-red-100 text-red-700",
  SKIP: "bg-gray-100 text-gray-500",
};

const SEV_STYLE: Record<string, string> = {
  hard: "bg-red-50 text-red-600 ring-1 ring-red-200",
  soft: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
};

const RULE_TYPE_STYLE: Record<RuleType, string> = {
  document_requirement: "bg-blue-50 text-blue-700",
  sla_check:            "bg-purple-50 text-purple-700",
  waiting_period:       "bg-orange-50 text-orange-700",
  data_masking:         "bg-teal-50 text-teal-700",
  coverage_mandate:     "bg-pink-50 text-pink-700",
};

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  document_requirement: "Document",
  sla_check:            "SLA",
  waiting_period:       "Waiting Period",
  data_masking:         "Data Masking",
  coverage_mandate:     "Coverage Mandate",
};

type Tab = "validate" | "rules" | "compare";

// ── Validate Tab ─────────────────────────────────────────────────────────────

function ValidateTab({ configs }: { configs: Record<string, CountryConfig> }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [report, setReport] = useState<ComplianceReport | null>(null);

  function run() {
    setReport(validateClaim(TEST_CLAIMS[selectedIdx].claim, configs));
  }

  const testClaim = TEST_CLAIMS[selectedIdx];
  const countryCodes = Object.keys(configs).sort();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-60">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Test Claim</label>
          <select
            value={selectedIdx}
            onChange={e => { setSelectedIdx(Number(e.target.value)); setReport(null); }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {countryCodes.map(country => (
              <optgroup key={country} label={configs[country]?.country_name ?? country}>
                {TEST_CLAIMS
                  .map((tc, i) => ({ tc, i }))
                  .filter(({ tc }) => tc.claim.country === country)
                  .map(({ tc, i }) => (
                    <option key={tc.claim.claim_id} value={i}>
                      {tc.claim.claim_id} — {tc.scenario}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <button
          onClick={run}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Run Validation
        </button>
      </div>

      <div className="flex gap-2 text-xs text-gray-500">
        <span>Expected:</span>
        <span className={`px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[testClaim.expected_status]}`}>
          {testClaim.expected_status.replace(/_/g, " ")}
        </span>
      </div>

      {report && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white">
            <div>
              <p className="text-xs text-gray-400 font-medium">Claim</p>
              <p className="text-sm font-bold text-gray-800">{report.claim_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Country</p>
              <p className="text-sm font-bold text-gray-800">
                {configs[report.country]?.country_name ?? report.country}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Submitted</p>
              <p className="text-sm font-bold text-gray-800">{report.submitted_date}</p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${STATUS_STYLE[report.overall_status]}`}>
                {report.overall_status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex gap-4 w-full pt-2 border-t border-gray-50 text-xs text-gray-500">
              <span>Rules applied: <strong className="text-gray-700">{report.rules_applied}</strong></span>
              <span>Passed: <strong className="text-emerald-600">{report.rules_passed}</strong></span>
              <span>Failed: <strong className="text-red-500">{report.rules_failed}</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Rule</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {report.results.map(r => (
                  <tr key={r.rule_id} className="bg-white hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{r.rule_id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${RULE_TYPE_STYLE[r.rule_type]}`}>
                        {RULE_TYPE_LABELS[r.rule_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SEV_STYLE[r.severity]}`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${RULE_STATUS_STYLE[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                      <p>{r.explanation}</p>
                      {r.remediation && (
                        <p className="mt-1 text-red-500 font-medium">{r.remediation}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Object.keys(report.masked_data).length > 0 && (
            <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4">
              <p className="text-xs font-semibold text-teal-700 mb-2">Masked Data (external reports)</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(report.masked_data).map(([field, value]) => (
                  <div key={field} className="bg-white rounded-lg border border-teal-100 px-3 py-2">
                    <p className="text-xs text-gray-400">{field}</p>
                    <p className="text-sm font-mono font-bold text-teal-700">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Rules Tab ─────────────────────────────────────────────────────────────────

function RulesTab({ configs }: { configs: Record<string, CountryConfig> }) {
  const countryCodes = Object.keys(configs).sort();
  const [country, setCountry] = useState(countryCodes[0] ?? "");
  const config = configs[country];

  const byType = config?.rules.reduce<Record<string, number>>((acc, r) => {
    acc[r.rule_type] = (acc[r.rule_type] ?? 0) + 1;
    return acc;
  }, {}) ?? {};

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Country</label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {countryCodes.map(c => (
              <option key={c} value={c}>{configs[c].country_name} ({c})</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          {Object.entries(byType).map(([type, count]) => (
            <span key={type} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${RULE_TYPE_STYLE[type as RuleType]}`}>
              {RULE_TYPE_LABELS[type as RuleType]}: {count}
            </span>
          ))}
        </div>
      </div>

      {config && (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Rule ID</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Sev</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Parameters</th>
                <th className="px-4 py-3 text-left">Effective</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {config.rules.map(r => (
                <tr key={r.rule_id} className="bg-white hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{r.rule_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${RULE_TYPE_STYLE[r.rule_type]}`}>
                      {RULE_TYPE_LABELS[r.rule_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SEV_STYLE[r.severity]}`}>
                      {r.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{r.description}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-xs truncate">
                    {Object.entries(r.parameters)
                      .filter(([k]) => k !== "condition")
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{r.effective_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Compare Tab ───────────────────────────────────────────────────────────────

function CompareTab({ configs }: { configs: Record<string, CountryConfig> }) {
  const countryCodes = Object.keys(configs).sort();
  const [codeA, setCodeA] = useState(countryCodes[0] ?? "");
  const [codeB, setCodeB] = useState(countryCodes[1] ?? "");
  const [diffs, setDiffs] = useState<RuleDiff[] | null>(null);

  function run() {
    if (codeA === codeB) return;
    setDiffs(diffCountries(codeA, codeB, configs));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        {([codeA, codeB] as const).map((val, i) => (
          <div key={i}>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Country {i === 0 ? "A" : "B"}</label>
            <select
              value={val}
              onChange={e => { (i === 0 ? setCodeA : setCodeB)(e.target.value); setDiffs(null); }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {countryCodes.map(c => (
                <option key={c} value={c}>{configs[c].country_name} ({c})</option>
              ))}
            </select>
          </div>
        ))}
        <button
          onClick={run}
          disabled={codeA === codeB}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Compare
        </button>
      </div>

      {diffs !== null && (
        diffs.length === 0 ? (
          <p className="text-sm text-gray-500">No differences found.</p>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-gray-400 mb-3">
              {diffs.length} difference{diffs.length !== 1 ? "s" : ""} between{" "}
              <strong>{configs[codeA]?.country_name}</strong> and <strong>{configs[codeB]?.country_name}</strong>
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Aspect</th>
                    <th className="px-4 py-3 text-left">{configs[codeA]?.country_name}</th>
                    <th className="px-4 py-3 text-left">{configs[codeB]?.country_name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {diffs.map((d, i) => {
                    const aVal = String(d.country_a.value);
                    const bVal = String(d.country_b.value);
                    const dimmed = (v: string) =>
                      v === "Not required" || v === "Not defined" || v === "Not mandated";
                    return (
                      <tr key={i} className="bg-white hover:bg-gray-50/50 border-l-2 border-l-transparent" style={{ borderLeftColor: "var(--rule-color)" }}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-700">{d.aspect}</p>
                          <span className={`mt-1 inline-block px-1.5 py-0.5 rounded text-xs ${RULE_TYPE_STYLE[d.rule_type]}`}>
                            {RULE_TYPE_LABELS[d.rule_type]}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-xs ${dimmed(aVal) ? "text-gray-400 italic" : "font-medium text-gray-800"}`}>
                          {aVal}
                        </td>
                        <td className={`px-4 py-3 text-xs ${dimmed(bVal) ? "text-gray-400 italic" : "font-medium text-gray-800"}`}>
                          {bVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "validate", label: "Validate Claim" },
  { id: "rules",    label: "Browse Rules"   },
  { id: "compare",  label: "Compare Countries" },
];

export default function Challenge12Client({ configs }: { configs: Record<string, CountryConfig> }) {
  const [tab, setTab] = useState<Tab>("validate");

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-1">Challenge 12</p>
        <h1 className="text-2xl font-bold text-gray-900">Multi-Country Regulatory Rule Engine</h1>
        <p className="mt-1 text-sm text-gray-500">
          Config-driven compliance validation — drop a new <code className="font-mono bg-gray-100 px-1 rounded">configs/XX.json</code> and the country appears automatically.
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
        {tab === "validate" && <ValidateTab configs={configs} />}
        {tab === "rules"    && <RulesTab configs={configs} />}
        {tab === "compare"  && <CompareTab configs={configs} />}
      </div>
    </div>
  );
}
