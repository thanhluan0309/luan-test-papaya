import { generateDirtyData, cleanData } from "@/lib/challenge-02";
import { Fragment } from "react/jsx-runtime";

const fmt = (n: number) => n.toLocaleString("en-US");

function StatCard({
  label,
  value,
  sub,
  color = "gray",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  const accent: Record<string, string> = {
    gray: "text-gray-900",
    green: "text-emerald-600",
    red: "text-red-500",
    blue: "text-blue-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-3xl font-extrabold mt-1 ${accent[color]}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Bar({
  value,
  max,
  color = "bg-blue-500",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function Challenge02() {
  const dirty = generateDirtyData(500, 42);
  const { report } = cleanData(dirty);

  const totalIssues = Object.values(report.issuesByType).reduce(
    (s, v) => s + v,
    0,
  );
  const maxTypeCount = Math.max(...Object.values(report.claimsByType));
  const maxStatusCount = Math.max(...Object.values(report.claimsByStatus));
  const maxDiagCount = report.top5Diagnoses[0]?.count ?? 1;

  const issueLabels: Record<string, string> = {
    duplicate_rows: "Duplicate rows",
    missing_claim_id: "Missing claim ID",
    missing_policy_id: "Missing policy ID",
    bad_name_casing: "Inconsistent name casing",
    claim_type_typo: "Claim type typo / abbreviation",
    bad_diagnosis: "Empty / N/A diagnosis",
    invalid_amount: "Invalid amount (negative / zero / string)",
    bad_currency: "Non-standard currency format",
    bad_date: "Non-ISO date format",
  };

  const typeColors: Record<string, string> = {
    OUTPATIENT: "bg-blue-500",
    INPATIENT: "bg-purple-500",
    DENTAL: "bg-emerald-500",
  };

  const statusColors: Record<string, string> = {
    APPROVED: "bg-emerald-500",
    REJECTED: "bg-red-400",
    PENDING: "bg-amber-400",
    IN_REVIEW: "bg-blue-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-gray-400">
            #02 · Beginner
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Claims Data Quality Report
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Generated from {fmt(report.totalBefore)} insurance claims with
          intentional data quality issues. Cleaned and analyzed using a
          deterministic pipeline.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Claims (before)"
          value={fmt(report.totalBefore)}
        />
        <StatCard
          label="Clean Records (after)"
          value={fmt(report.totalAfter)}
          color="green"
          sub={`${report.totalBefore - report.totalAfter} removed`}
        />
        <StatCard
          label="Duplicates Removed"
          value={report.duplicatesRemoved}
          color="red"
        />
        <StatCard
          label="Issues Detected"
          value={totalIssues}
          color="blue"
          sub="across all issue types"
        />
      </div>

      {/* Issues breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Issues by Type
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Detected before removal. Fixable issues were normalized; invalid
            rows were dropped.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Issue</th>
              <th className="px-6 py-3 text-right font-medium">Count</th>
              <th className="px-6 py-3 text-left font-medium hidden md:table-cell w-48">
                Share
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Object.entries(report.issuesByType)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">
                    {issueLabels[key] ?? key}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-gray-900">
                    {count}
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                    <Bar value={count} max={totalIssues} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Distribution charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* By Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Claims by Type
          </h2>
          <div className="space-y-3">
            {Object.entries(report.claimsByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">{type}</span>
                    <span className="text-gray-900 font-semibold">
                      {fmt(count)}
                    </span>
                  </div>
                  <Bar
                    value={count}
                    max={maxTypeCount}
                    color={typeColors[type] ?? "bg-gray-400"}
                  />
                </div>
              ))}
          </div>
        </div>

        {/* By Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Claims by Status
          </h2>
          <div className="space-y-3">
            {Object.entries(report.claimsByStatus)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">{status}</span>
                    <span className="text-gray-900 font-semibold">
                      {fmt(count)}
                    </span>
                  </div>
                  <Bar
                    value={count}
                    max={maxStatusCount}
                    color={statusColors[status] ?? "bg-gray-400"}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Avg amounts + Top diagnoses */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Avg amounts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Average Amount by Claim Type
          </h2>
          <div className="divide-y divide-gray-100">
            {Object.entries(report.avgAmountByType).map(([type, avg]) => (
              <div
                key={type}
                className="py-3 flex justify-between items-center"
              >
                <span className="text-sm text-gray-600">{type}</span>
                <span className="text-sm font-semibold text-gray-900">
                  ฿{fmt(avg)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 diagnoses */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Top 5 Diagnoses
          </h2>
          <div className="space-y-3">
            {report.top5Diagnoses.map((d, i) => (
              <div key={d.diagnosis}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">
                    <span className="text-gray-400 mr-2">#{i + 1}</span>
                    {d.diagnosis}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {d.count} claims · avg ฿{fmt(d.avgAmount)}
                  </span>
                </div>
                <Bar value={d.count} max={maxDiagCount} color="bg-indigo-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sample data */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Sample: Before vs After</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            5 rows that had at least one issue — bold cells show what changed
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left sticky left-0 bg-gray-50">Field</th>
                {report.samplePairs.map((_, i) => (
                  <th key={i} className="px-4 py-2 text-center whitespace-nowrap">
                    Sample {i + 1}
                    <div className="text-gray-400 font-normal normal-case tracking-normal">
                      {report.samplePairs[i].changed.join(", ")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["member_name", "claim_type", "submitted_date", "currency", "submitted_amount", "diagnosis"] as const).map(
                (field) => (
                  <Fragment key={field}>
                    <tr className="bg-red-50 border-t border-red-100">
                      <td className="px-4 py-1.5 text-red-500 sticky left-0 bg-red-50 whitespace-nowrap">
                        {field} <span className="opacity-60">(raw)</span>
                      </td>
                      {report.samplePairs.map(({ dirty, changed }, i) => {
                        const didChange = changed.includes(field);
                        return (
                          <td key={i} className={`px-4 py-1.5 text-center ${didChange ? "text-red-700 font-bold" : "text-red-300"}`}>
                            {dirty[field] || <span className="text-gray-300 font-normal">empty</span>}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="bg-emerald-50 border-b border-emerald-100">
                      <td className="px-4 py-1.5 text-emerald-600 sticky left-0 bg-emerald-50 whitespace-nowrap">
                        {field} <span className="opacity-60">(clean)</span>
                      </td>
                      {report.samplePairs.map(({ clean: c, changed }, i) => {
                        const val = c[field as keyof typeof c];
                        const didChange = changed.includes(field);
                        return (
                          <td key={i} className={`px-4 py-1.5 text-center ${didChange ? "text-emerald-800 font-bold" : "text-emerald-400"}`}>
                            {val !== null && val !== undefined
                              ? String(val)
                              : <span className="text-gray-300 font-normal">null</span>}
                          </td>
                        );
                      })}
                    </tr>
                  </Fragment>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
