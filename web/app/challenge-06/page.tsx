"use client";

import { Fragment, useState } from "react";
import { calculateBenefits } from "@/lib/challenge-06/calculator";
import { policy, expenses } from "@/lib/challenge-06/data";
import type {
  ExpenseResult,
  BenefitSummary,
  Decision,
} from "@/lib/challenge-06/types";

const { results, summary } = calculateBenefits(policy, expenses);

const fmt = (n: number) => `฿${n.toLocaleString("en-US")}`;

const decisionConfig: Record<
  Decision,
  { label: string; badge: string; row: string }
> = {
  COVERED: {
    label: "Covered",
    badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    row: "",
  },
  PARTIALLY_COVERED: {
    label: "Partial",
    badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    row: "",
  },
  DENIED: {
    label: "Denied",
    badge: "bg-red-100 text-red-700 ring-1 ring-red-200",
    row: "opacity-60",
  },
};

function SummaryCard({
  label,
  value,
  sub,
  color = "text-slate-900",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function LimitBar({
  label,
  original_limit,
  used,
  remaining,
}: BenefitSummary & { label?: string }) {
  const pct =
    original_limit > 0 ? Math.round((used / original_limit) * 100) : 0;
  const barColor =
    pct >= 100 ? "bg-red-400" : pct >= 75 ? "bg-amber-400" : "bg-blue-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-slate-400">{fmt(remaining)} remaining</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
        <span>Used: {fmt(used)}</span>
        <span>Limit: {fmt(original_limit)}</span>
      </div>
    </div>
  );
}

export default function Challenge06() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalSubmitted = results.reduce((s, r) => s + r.submitted_amount, 0);
  const totalCovered = results.reduce((s, r) => s + r.covered_amount, 0);
  const totalMember = results.reduce((s, r) => s + r.member_pays, 0);
  const denialCount = results.filter((r) => r.decision === "DENIED").length;

  const expenseMap = Object.fromEntries(expenses.map((e) => [e.expense_id, e]));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-mono text-slate-400">
          #06 · Intermediate
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Policy Benefits Calculator
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {policy.plan.name} ({policy.plan.tier}) · {expenses.length} expenses
          processed chronologically
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Total Submitted" value={fmt(totalSubmitted)} />
        <SummaryCard
          label="Total Covered"
          value={fmt(totalCovered)}
          color="text-emerald-700"
        />
        <SummaryCard
          label="Member Pays"
          value={fmt(totalMember)}
          color="text-amber-700"
        />
        <SummaryCard
          label="Denials"
          value={`${denialCount} / ${results.length}`}
          sub={`${Math.round((denialCount / results.length) * 100)}% denial rate`}
          color={denialCount > 0 ? "text-red-600" : "text-slate-900"}
        />
      </div>

      {/* Expense results table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Expense Results
          </h2>
          <div className="flex items-center gap-3 text-[11px]">
            {(["COVERED", "PARTIALLY_COVERED", "DENIED"] as Decision[]).map(
              (d) => (
                <span
                  key={d}
                  className={`px-2 py-0.5 rounded-full font-medium ${decisionConfig[d].badge}`}
                >
                  {decisionConfig[d].label}
                </span>
              ),
            )}
          </div>
        </div>

        {/* Desktop table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Benefit</th>
                <th className="px-4 py-2.5 font-medium">Sub-benefit</th>
                <th className="px-4 py-2.5 font-medium text-right">
                  Submitted
                </th>
                <th className="px-4 py-2.5 font-medium text-right">Covered</th>
                <th className="px-4 py-2.5 font-medium text-right">
                  Member Pays
                </th>
                <th className="px-4 py-2.5 font-medium text-center">
                  Decision
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => {
                const exp = expenseMap[r.expense_id];
                const cfg = decisionConfig[r.decision];
                const isExpanded = expandedId === r.expense_id;
                return (
                  <Fragment key={r.expense_id}>
                    <tr
                      onClick={() =>
                        setExpandedId(isExpanded ? null : r.expense_id)
                      }
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${cfg.row} ${isExpanded ? "bg-blue-50/40" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {r.expense_id}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{exp?.date}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {exp?.benefit_type}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {exp?.sub_benefit}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {fmt(r.submitted_amount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700">
                        {r.covered_amount > 0 ? fmt(r.covered_amount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {fmt(r.member_pays)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-blue-50/30">
                        <td colSpan={8} className="px-6 py-3">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3 text-xs">
                            <div className="flex-1">
                              <span className="font-semibold text-slate-600">
                                Reason:{" "}
                              </span>
                              <span className="text-slate-600">{r.reason}</span>
                            </div>
                            <div className="flex gap-4 shrink-0 text-slate-500">
                              {r.remaining_annual_limit !== null && (
                                <span>
                                  Annual remaining:{" "}
                                  <strong className="text-slate-700">
                                    {fmt(r.remaining_annual_limit)}
                                  </strong>
                                </span>
                              )}
                              {r.remaining_visit_limit !== null && (
                                <span>
                                  Visits left:{" "}
                                  <strong className="text-slate-700">
                                    {r.remaining_visit_limit}
                                  </strong>
                                </span>
                              )}
                            </div>
                          </div>
                          {exp?.diagnosis && (
                            <div className="mt-1 text-xs text-slate-400">
                              Diagnosis: {exp.diagnosis} · Provider:{" "}
                              {exp.provider}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remaining limits */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Remaining Benefit Limits
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {summary.map((s) => (
            <LimitBar key={s.benefit_type} {...s} label={s.benefit_type} />
          ))}
        </div>
      </div>
    </div>
  );
}
