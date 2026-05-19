"use client";

import { useState } from "react";
import { policies, fmt, type Policy, type Benefit, type SubBenefit } from "@/lib/challenge-05/data";

const tierColors: Record<string, string> = {
  Gold:   "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  Silver: "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
  Bronze: "bg-orange-100 text-orange-800 ring-1 ring-orange-300",
};

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function subBenefitLimit(sub: SubBenefit): string {
  if (sub.limit_per_day)        return `${fmt(sub.limit_per_day)}/day${sub.max_days ? ` · max ${sub.max_days} days` : ""}`;
  if (sub.limit_per_visit)      return `${fmt(sub.limit_per_visit)}/visit${sub.visits_per_year ? ` · ${sub.visits_per_year}x/yr` : ""}`;
  if (sub.limit_per_event)      return `${fmt(sub.limit_per_event)}/event`;
  if (sub.limit_per_year)       return `${fmt(sub.limit_per_year)}/year`;
  if (sub.limit_per_pregnancy)  return `${fmt(sub.limit_per_pregnancy)}/pregnancy`;
  return "—";
}

function BenefitCard({ benefit }: { benefit: Benefit }) {
  const topLimit = benefit.annual_limit
    ? `Annual limit: ${fmt(benefit.annual_limit)}`
    : benefit.lifetime_limit
    ? `Lifetime limit: ${fmt(benefit.lifetime_limit)}`
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-semibold text-slate-800">{benefit.type}</span>
        <div className="flex items-center gap-2 flex-wrap">
          {topLimit && (
            <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
              {topLimit}
            </span>
          )}
          {benefit.waiting_period_days && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              ⚠ {benefit.waiting_period_days}-day waiting period
            </span>
          )}
        </div>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {benefit.sub_benefits.map((sub, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
              <td className="px-5 py-2.5 text-slate-700">{sub.name}</td>
              <td className="px-5 py-2.5 text-right text-slate-600 font-medium tabular-nums">
                {subBenefitLimit(sub)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuickReference({ policy }: { policy: Policy }) {
  const maxBenefit = policy.benefits.reduce<{ type: string; limit: number } | null>((best, b) => {
    const limit = b.annual_limit ?? b.lifetime_limit ?? 0;
    return !best || limit > best.limit ? { type: b.type, limit } : best;
  }, null);

  const opdCopay = policy.copay["Outpatient"];
  const waitingCount = policy.benefits.filter((b) => b.waiting_period_days).length;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
      <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">
        Quick Reference
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-x divide-blue-100">
        <StatCell
          label="Largest Benefit"
          value={maxBenefit ? fmt(maxBenefit.limit) : "—"}
          sub={maxBenefit?.type}
        />
        <StatCell
          label="Benefit Types"
          value={String(policy.benefits.length)}
          sub="categories"
        />
        <StatCell
          label="OPD Copay"
          value={opdCopay ? `${opdCopay.percentage}%` : "—"}
          sub={opdCopay?.max_per_visit ? `max ${fmt(opdCopay.max_per_visit)}/visit` : undefined}
        />
        <StatCell
          label="Network Hospitals"
          value={policy.network.hospital_count.toLocaleString()}
          sub={policy.network.countries.join(", ")}
        />
      </div>
      {waitingCount > 0 && (
        <div className="mt-4 pt-3 border-t border-blue-200 text-xs text-amber-700 flex items-center gap-1.5">
          <span>⚠</span>
          <span>
            {waitingCount} benefit{waitingCount !== 1 ? "s" : ""} have waiting periods — review before filing claims.
          </span>
        </div>
      )}
    </div>
  );
}

export default function Challenge05() {
  const [selected, setSelected] = useState(0);
  const policy = policies[selected];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-mono text-slate-400">#05 · Beginner</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Policy Summary Generator</h1>
        <p className="mt-1 text-sm text-slate-500">
          Formatted summary of an insurance policy — select a policy to preview.
        </p>
      </div>

      {/* Policy tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {policies.map((p, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              selected === i
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {p.plan.name}
          </button>
        ))}
      </div>

      {/* Quick Reference */}
      <QuickReference policy={policy} />

      {/* Policy Overview + Member Breakdown */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <SectionCard title="Policy Overview" icon="📋">
          <dl className="space-y-2.5">
            {[
              ["Policy Number",  policy.policy_number],
              ["Plan",           `${policy.plan.name} — ${policy.plan.tier}`],
              ["Policyholder",   policy.policyholder.name],
              ["Type",           `${policy.policyholder.type}${policy.policyholder.employee_count ? ` · ${policy.policyholder.employee_count} employees` : ""}`],
              ["Industry",       policy.policyholder.industry],
              ["Effective",      policy.plan.effective_date],
              ["Expiry",         policy.plan.expiry_date],
              ["Currency",       policy.plan.currency],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start gap-4 text-sm">
                <dt className="text-slate-500 shrink-0">{label}</dt>
                <dd className="text-slate-800 font-medium text-right">
                  {label === "Plan" ? (
                    <span className="flex items-center gap-1.5 justify-end flex-wrap">
                      {policy.plan.name}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[policy.plan.tier] ?? "bg-slate-100 text-slate-600"}`}>
                        {policy.plan.tier}
                      </span>
                    </span>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Member Breakdown" icon="👥">
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Total Members",     policy.members.total,              "insured lives"],
              ["Employees",         policy.members.employee,           "primary members"],
              ["Dependent Spouses", policy.members.dependent_spouse ?? 0, "spouses"],
              ["Dependent Children",policy.members.dependent_child ?? 0,  "children"],
            ].map(([label, value, sub]) => (
              <div key={String(label)} className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-slate-900">{Number(value).toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-0.5">{String(sub)}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{String(label)}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Benefits */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Benefits</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {policy.benefits.map((b, i) => (
            <BenefitCard key={i} benefit={b} />
          ))}
        </div>
      </div>

      {/* Copay + Waiting Periods */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <SectionCard title="Copay Schedule" icon="💳">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium text-right">Copay %</th>
                <th className="pb-2 font-medium text-right">Max / Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(policy.copay).map(([type, c]) => (
                <tr key={type}>
                  <td className="py-2.5 text-slate-700 font-medium">{type}</td>
                  <td className="py-2.5 text-right text-slate-800 font-semibold">
                    {c.percentage === 0 ? (
                      <span className="text-emerald-600">None</span>
                    ) : (
                      `${c.percentage}%`
                    )}
                  </td>
                  <td className="py-2.5 text-right text-slate-600">
                    {c.max_per_visit ? fmt(c.max_per_visit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Waiting Periods" icon="⏳">
          {policy.benefits.filter((b) => b.waiting_period_days).length === 0 ? (
            <p className="text-sm text-slate-400">No waiting periods apply to this policy.</p>
          ) : (
            <div className="space-y-2">
              {policy.benefits
                .filter((b) => b.waiting_period_days)
                .map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                  >
                    <span className="text-sm font-medium text-amber-900">{b.type}</span>
                    <span className="text-sm font-bold text-amber-700 tabular-nums">
                      {b.waiting_period_days} days
                    </span>
                  </div>
                ))}
              <p className="text-xs text-slate-400 pt-1">
                Benefits with waiting periods are not payable until after the waiting period from policy effective date.
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Exclusions + Network */}
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Exclusions" icon="🚫">
          <ul className="space-y-2">
            {policy.exclusions.map((ex, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm border-l-2 border-red-300 bg-red-50/60 pl-3 py-1.5 rounded-r-lg text-slate-700"
              >
                <span className="text-red-400 shrink-0 font-bold">×</span>
                {ex}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Network" icon="🏥">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Network Type</span>
              <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full">
                {policy.network.type}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Hospitals</span>
              <span className="text-2xl font-bold text-slate-900">
                {policy.network.hospital_count.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Coverage Countries</span>
              <div className="flex flex-wrap gap-2">
                {policy.network.countries.map((c) => (
                  <span
                    key={c}
                    className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
