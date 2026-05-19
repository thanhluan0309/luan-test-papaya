"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { claims } from "@/lib/challenge-10/data";
import { scoreClaims } from "@/lib/challenge-10/engine";
import { computeMetrics } from "@/lib/challenge-10/metrics";
import type { ScoringResult } from "@/lib/challenge-10/types";

const RULE_LABELS: Record<string, string> = {
  duplicate_claim:        "Duplicate Claim",
  rapid_resubmission:     "Rapid Re-submission",
  upcoding:               "Upcoding",
  unbundling:             "Unbundling",
  phantom_billing:        "Phantom Billing",
  weekend_anomaly:        "Weekend Anomaly",
  dx_procedure_mismatch:  "DX-Procedure Mismatch",
  amount_clustering:      "Amount Clustering",
};

const RULE_COLORS: Record<string, string> = {
  duplicate_claim:        "#ef4444",
  rapid_resubmission:     "#f97316",
  upcoding:               "#eab308",
  unbundling:             "#84cc16",
  phantom_billing:        "#06b6d4",
  weekend_anomaly:        "#8b5cf6",
  dx_procedure_mismatch:  "#ec4899",
  amount_clustering:      "#14b8a6",
};

const SEV_COLORS = ["", "bg-gray-200 text-gray-600", "bg-blue-100 text-blue-700",
                    "bg-amber-100 text-amber-700", "bg-orange-100 text-orange-700",
                    "bg-red-100 text-red-800"];

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "text-red-600" : s >= 40 ? "text-orange-500" : "text-amber-500";

const PAGE_SIZE = 15;

function KpiCard({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${good === undefined ? "text-gray-900" : good ? "text-emerald-600" : "text-red-500"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ScoredRow({ result, expanded, onToggle }: {
  result: ScoringResult & { rank: number; claim: (typeof claims)[0] };
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors border-b border-gray-50 ${expanded ? "bg-blue-50" : "hover:bg-gray-50"}`}
      >
        <td className="px-4 py-2.5 text-xs font-bold text-gray-400">#{result.rank}</td>
        <td className="px-4 py-2.5 text-sm font-mono text-blue-600">{result.claim_id}</td>
        <td className="px-4 py-2.5 text-xs text-gray-600">{result.claim?.member_id}</td>
        <td className="px-4 py-2.5 text-xs text-gray-600 hidden sm:table-cell">{result.claim?.provider_id}</td>
        <td className="px-4 py-2.5">
          <span className={`text-base font-bold tabular-nums ${SCORE_COLOR(result.risk_score)}`}>
            {result.risk_score}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
            <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">
              {result.flags.length}
            </span>
          </span>
        </td>
        <td className="px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell">{result.claim?.claim_date}</td>
        <td className="px-4 py-2.5 text-xs text-gray-400">{expanded ? "▾" : "▸"}</td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50/50">
          <td colSpan={8} className="px-4 pb-3 pt-1">
            <div className="space-y-2">
              {result.flags.map((f, i) => (
                <div key={i} className="flex gap-3 items-start bg-white rounded-lg p-2.5 border border-blue-100">
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {RULE_LABELS[f.rule] ?? f.rule}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${SEV_COLORS[f.severity] ?? SEV_COLORS[3]}`}>
                      sev {f.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{f.evidence}</p>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Challenge10Page() {
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState<"risk_score" | "flags">("risk_score");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { results, metrics } = useMemo(() => {
    const results = scoreClaims(claims);
    const metrics = computeMetrics(results, claims);
    return { results, metrics };
  }, []);

  const claimMap = useMemo(() => new Map(claims.map(c => [c.claim_id, c])), []);

  const histogram = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}–${i * 10 + 9}`,
      count: 0,
      color: i >= 7 ? "#ef4444" : i >= 4 ? "#f97316" : "#94a3b8",
    }));
    for (const r of results) {
      const b = Math.min(9, Math.floor(r.risk_score / 10));
      buckets[b].count++;
    }
    return buckets;
  }, [results]);

  const ruleBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of results) {
      for (const f of r.flags) {
        counts.set(f.rule, (counts.get(f.rule) ?? 0) + 1);
      }
    }
    return Object.keys(RULE_LABELS)
      .map(rule => ({ rule, label: RULE_LABELS[rule], count: counts.get(rule) ?? 0, color: RULE_COLORS[rule] }))
      .sort((a, b) => b.count - a.count);
  }, [results]);

  const sorted = useMemo(() => {
    const ranked = results.map((r, i) => ({
      ...r, rank: i + 1, claim: claimMap.get(r.claim_id)!,
    }));
    if (sortCol === "flags") return [...ranked].sort((a, b) => b.flags.length - a.flags.length);
    return ranked;
  }, [results, sortCol, claimMap]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🔍</span>
            <h1 className="text-2xl font-bold text-gray-900">Fraud Detection Scoring Engine</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
              Advanced · 4–6h
            </span>
          </div>
          <p className="text-gray-400 text-sm ml-11">
            Rule-based scoring engine — 8 detection rules, risk score 0–100, evidence per flag.
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <KpiCard label="Total Claims" value={metrics.total_claims.toLocaleString()} />
          <KpiCard label="Known Fraud" value={metrics.known_fraud.toLocaleString()} sub="ground truth" />
          <KpiCard label="Flagged" value={metrics.flagged_claims.toLocaleString()} sub={`${fmtPct(metrics.flagged_claims / metrics.total_claims)} of total`} />
          <KpiCard label="True Positives" value={metrics.true_positives.toString()} good={metrics.true_positives > metrics.false_negatives} />
          <KpiCard label="False Positives" value={metrics.false_positives.toString()} good={metrics.false_positive_rate <= 0.2} />
          <KpiCard
            label="Recall"
            value={fmtPct(metrics.recall)}
            sub="target ≥70%"
            good={metrics.recall >= 0.7}
          />
          <KpiCard
            label="Precision"
            value={fmtPct(metrics.precision)}
            sub={`FPR ${fmtPct(metrics.false_positive_rate)}`}
            good={metrics.false_positive_rate <= 0.2}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Score distribution */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Score Distribution</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={histogram} barSize={24}>
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [v, "Claims"]} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {histogram.map((h, i) => <Cell key={i} fill={h.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rule breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Claims Flagged per Rule</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ruleBreakdown} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={140} />
                <Tooltip formatter={(v) => [v, "Claims"]} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {ruleBreakdown.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              Flagged Claims
              <span className="ml-2 text-xs font-normal text-gray-400">({results.length} total)</span>
            </p>
            <div className="flex gap-2 text-xs">
              <span className="text-gray-400">Sort by:</span>
              {(["risk_score", "flags"] as const).map(col => (
                <button
                  key={col}
                  onClick={() => { setSortCol(col); setPage(0); }}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${sortCol === col ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {col === "risk_score" ? "Score" : "Flags"}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-2 text-left w-10">Rank</th>
                <th className="px-4 py-2 text-left">Claim ID</th>
                <th className="px-4 py-2 text-left">Member</th>
                <th className="px-4 py-2 text-left hidden sm:table-cell">Provider</th>
                <th className="px-4 py-2 text-left">Score</th>
                <th className="px-4 py-2 text-left">Flags</th>
                <th className="px-4 py-2 text-left hidden md:table-cell">Date</th>
                <th className="px-4 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {pageRows.map(r => (
                <ScoredRow
                  key={r.claim_id}
                  result={r}
                  expanded={expanded === r.claim_id}
                  onToggle={() => setExpanded(expanded === r.claim_id ? null : r.claim_id)}
                />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <span className="px-3 py-1 text-xs text-gray-500">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
