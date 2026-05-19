"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { claims as allClaims } from "@/lib/challenge-09/data";
import {
  applyFilters,
  kpiApprovalRate, kpiAvgProcessingDays, kpiTotalApproved, kpiAvgClaimAmount,
  byStatus, byMonth, byWeek,
  top10ByFrequency, top10ByCost,
  processingTimeDist, approvalByInsurer,
  ICD10_LABELS,
} from "@/lib/challenge-09/utils";
import type { Claim, Filters, ClaimType, ClaimStatus } from "@/lib/challenge-09/types";

// ── Config ────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  APPROVED:   "#10b981",
  REJECTED:   "#ef4444",
  PENDING:    "#f59e0b",
  IN_REVIEW:  "#3b82f6",
};
const STATUS_LABELS: Record<string, string> = {
  APPROVED:   "Approved",
  REJECTED:   "Rejected",
  PENDING:    "Pending",
  IN_REVIEW:  "In Review",
};
const STATUS_BADGE: Record<string, string> = {
  APPROVED:   "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  REJECTED:   "bg-red-100 text-red-700 ring-1 ring-red-200",
  PENDING:    "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  IN_REVIEW:  "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
};
const TYPE_COLORS: Record<string, string> = {
  OUTPATIENT: "#3b82f6",
  INPATIENT:  "#8b5cf6",
  DENTAL:     "#10b981",
  MATERNITY:  "#f43f5e",
};

const fmt     = (n: number) => `฿${n.toLocaleString("en-US")}`;
const fmtK    = (n: number) => n >= 1_000_000 ? `฿${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `฿${(n / 1000).toFixed(0)}K` : `฿${n}`;
const PAGE_SZ = 10;

const INSURERS  = ["ALL", "AIA Thailand", "Prudential Vietnam", "AXA Hong Kong"];
const COUNTRIES = ["ALL", "Thailand", "Vietnam", "Hong Kong"];

const INITIAL_FILTERS: Filters = {
  claimType: "ALL",
  status:    "ALL",
  insurer:   "ALL",
  country:   "ALL",
  dateFrom:  "2024-01-01",
  dateTo:    "2024-12-31",
};

// ── KPI card ──────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = "text-slate-900" }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

// ── Select filter ─────────────────────────────────────────────────
function FilterSelect({ label, value, options, onChange }: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[130px]">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Chart panel wrapper ───────────────────────────────────────────
function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ── Sort header ───────────────────────────────────────────────────
type SortCol = keyof Claim;
function SortTh({ col, label, sort, onSort }: {
  col: SortCol; label: string;
  sort: { col: SortCol; dir: "asc" | "desc" };
  onSort: (c: SortCol) => void;
}) {
  const active = sort.col === col;
  return (
    <th
      onClick={() => onSort(col)}
      className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 whitespace-nowrap"
    >
      {label}{active ? (sort.dir === "asc" ? " ↑" : " ↓") : " ↕"}
    </th>
  );
}

// ── CSV export ────────────────────────────────────────────────────
function exportCsv(data: Claim[]) {
  const COLS: (keyof Claim)[] = [
    "claim_id","policy_id","member_name","claim_type","diagnosis_icd10",
    "submitted_amount","approved_amount","status","submitted_date",
    "processed_date","assessor","insurer","country",
  ];
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [COLS.join(","), ...data.map((c) => COLS.map((k) => cell(c[k])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  Object.assign(document.createElement("a"), { href: url, download: "claims-export.csv" }).click();
  URL.revokeObjectURL(url);
}

// ── Main ──────────────────────────────────────────────────────────
export default function Challenge09() {
  const [filters, setFilters]           = useState<Filters>(INITIAL_FILTERS);
  const [timeGroup, setTimeGroup]       = useState<"month" | "week">("month");
  const [sort, setSort]                 = useState<{ col: SortCol; dir: "asc" | "desc" }>({ col: "submitted_date", dir: "desc" });
  const [page, setPage]                 = useState(1);
  const [diagDrillDown, setDiagDrillDown] = useState<string | null>(null);
  const [searchRaw, setSearchRaw]         = useState("");
  const [search, setSearch]               = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchRaw.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchRaw]);

  const filtered = useMemo(() => applyFilters(allClaims, filters), [filters]);

  const tableData = useMemo(() => {
    let base = diagDrillDown ? filtered.filter((c) => c.diagnosis_icd10 === diagDrillDown) : filtered;
    if (search) {
      base = base.filter((c) =>
        c.claim_id.toLowerCase().includes(search) ||
        c.member_name.toLowerCase().includes(search) ||
        c.diagnosis_icd10.toLowerCase().includes(search) ||
        (ICD10_LABELS[c.diagnosis_icd10] ?? "").toLowerCase().includes(search) ||
        c.insurer.toLowerCase().includes(search) ||
        c.country.toLowerCase().includes(search) ||
        c.assessor.toLowerCase().includes(search) ||
        c.status.toLowerCase().includes(search)
      );
    }
    return [...base].sort((a, b) => {
      const av = a[sort.col] as string | number | null;
      const bv = b[sort.col] as string | number | null;
      const as_ = av ?? "";
      const bs_ = bv ?? "";
      const cmp = as_ < bs_ ? -1 : as_ > bs_ ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort, diagDrillDown, search]);

  const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE_SZ));
  const pageRows   = tableData.slice((page - 1) * PAGE_SZ, page * PAGE_SZ);

  const trendData     = useMemo(() => timeGroup === "month" ? byMonth(filtered) : byWeek(filtered), [filtered, timeGroup]);
  const statusData    = useMemo(() => byStatus(filtered), [filtered]);
  const freqData      = useMemo(() => top10ByFrequency(filtered), [filtered]);
  const costData      = useMemo(() => top10ByCost(filtered), [filtered]);
  const histData      = useMemo(() => processingTimeDist(filtered), [filtered]);
  const insurerData   = useMemo(() => approvalByInsurer(filtered), [filtered]);

  function patch<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  }
  function handleSort(col: SortCol) {
    setSort((s) => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
    setPage(1);
  }
  function handleDiagClick(code: string) {
    setDiagDrillDown((prev) => prev === code ? null : code);
    setPage(1);
  }

  const noData = (h: number) => (
    <div className={`flex items-center justify-center text-sm text-slate-400`} style={{ height: h }}>No data</div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-mono text-slate-400">#09 · Intermediate</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Claims Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          {allClaims.length.toLocaleString()} claims · Jan–Dec 2024
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex flex-wrap gap-4 items-end">
        <FilterSelect label="Claim Type" value={filters.claimType}
          options={[
            { value: "ALL",        label: "All Types" },
            { value: "OUTPATIENT", label: "Outpatient" },
            { value: "INPATIENT",  label: "Inpatient" },
            { value: "DENTAL",     label: "Dental" },
            { value: "MATERNITY",  label: "Maternity" },
          ]}
          onChange={(v) => patch("claimType", v as ClaimType | "ALL")}
        />
        <FilterSelect label="Status" value={filters.status}
          options={[
            { value: "ALL",       label: "All Statuses" },
            { value: "APPROVED",  label: "Approved" },
            { value: "REJECTED",  label: "Rejected" },
            { value: "PENDING",   label: "Pending" },
            { value: "IN_REVIEW", label: "In Review" },
          ]}
          onChange={(v) => patch("status", v as ClaimStatus | "ALL")}
        />
        <FilterSelect label="Insurer" value={filters.insurer}
          options={INSURERS.map((i) => ({ value: i, label: i === "ALL" ? "All Insurers" : i }))}
          onChange={(v) => patch("insurer", v)}
        />
        <FilterSelect label="Country" value={filters.country}
          options={COUNTRIES.map((c) => ({ value: c, label: c === "ALL" ? "All Countries" : c }))}
          onChange={(v) => patch("country", v)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date From</label>
          <input type="date" value={filters.dateFrom} min="2024-01-01" max="2024-12-31"
            onChange={(e) => patch("dateFrom", e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date To</label>
          <input type="date" value={filters.dateTo} min="2024-01-01" max="2024-12-31"
            onChange={(e) => patch("dateTo", e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="ml-auto flex items-end pb-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{filtered.length.toLocaleString()} claims</span>
            <button onClick={() => { setFilters(INITIAL_FILTERS); setDiagDrillDown(null); setPage(1); }}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Total Claims"     value={filtered.length.toLocaleString()} />
        <KpiCard label="Approval Rate"    value={`${kpiApprovalRate(filtered)}%`}
          color={kpiApprovalRate(filtered) >= 70 ? "text-emerald-700" : "text-amber-600"} />
        <KpiCard label="Avg Processing"   value={`${kpiAvgProcessingDays(filtered)} days`} />
        <KpiCard label="Total Approved"   value={fmtK(kpiTotalApproved(filtered))} color="text-emerald-700" />
        <KpiCard label="Avg Claim Amount" value={fmtK(kpiAvgClaimAmount(filtered))} />
      </div>

      {/* Charts row 1: Status pie + Trend line */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <ChartPanel title="Claims by Status">
          {statusData.length === 0 ? noData(220) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="status" cx="50%" cy="45%" outerRadius={72} innerRadius={40}>
                  {statusData.map((d) => <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? "#94a3b8"} />)}
                </Pie>
                <Tooltip formatter={(v, name) => [v, STATUS_LABELS[String(name)] ?? name]} />
                <Legend formatter={(v) => STATUS_LABELS[v] ?? v} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Claims Over Time</h2>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
              {(["month", "week"] as const).map((g) => (
                <button key={g} onClick={() => setTimeGroup(g)}
                  className={`px-3 py-1.5 font-medium transition-colors ${timeGroup === g ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  {g === "month" ? "Monthly" : "Weekly"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} interval={timeGroup === "week" ? 3 : 0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Claims" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2: Top 10 diagnoses */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartPanel title="Top 10 Diagnoses — Frequency (click to drill down)">
          {freqData.length === 0 ? noData(260) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={freqData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                onClick={(d) => { const pl = (d as { activePayload?: { payload: { code: string } }[] })?.activePayload; if (pl?.[0]) handleDiagClick(pl[0].payload.code); }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" name="Claims" radius={[0, 4, 4, 0]} cursor="pointer">
                  {freqData.map((d) => (
                    <Cell key={d.code} fill={diagDrillDown === d.code ? "#1d4ed8" : "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Top 10 Diagnoses — Approved Amount (click to drill down)">
          {costData.length === 0 ? noData(260) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={costData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                onClick={(d) => { const pl = (d as { activePayload?: { payload: { code: string } }[] })?.activePayload; if (pl?.[0]) handleDiagClick(pl[0].payload.code); }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(v) => [fmt(v as number), "Approved"]} />
                <Bar dataKey="total" name="Approved" radius={[0, 4, 4, 0]} cursor="pointer">
                  {costData.map((d) => (
                    <Cell key={d.code} fill={diagDrillDown === d.code ? "#047857" : "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>

      {/* Charts row 3: Processing time histogram + Approval by insurer */}
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <ChartPanel title="Processing Time Distribution">
          {histData.every((d) => d.count === 0) ? noData(200) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={histData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="bin" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Claims" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Approval Rate by Insurer">
          {insurerData.length === 0 ? noData(200) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={insurerData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="insurer" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="approved" name="Approved" fill="#10b981" stackId="a" />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" stackId="a" />
                <Bar dataKey="pending"  name="Pending"  fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>

      {/* Claims table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-700 shrink-0">
            Claims
            {diagDrillDown && (
              <span className="ml-2 text-blue-600 font-normal">
                · {ICD10_LABELS[diagDrillDown] ?? diagDrillDown}
                <button onClick={() => { setDiagDrillDown(null); setPage(1); }}
                  className="ml-2 text-slate-400 hover:text-red-500 transition-colors text-xs"
                >✕ clear</button>
              </span>
            )}
          </h2>
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <input
              type="text"
              placeholder="Search ID, name, diagnosis, insurer…"
              value={searchRaw}
              onChange={(e) => { setSearchRaw(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            {searchRaw && (
              <button onClick={() => { setSearchRaw(""); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >✕</button>
            )}
          </div>
          <span className="text-xs text-slate-400 ml-auto">Page {page} / {totalPages}</span>
          <button
            onClick={() => exportCsv(tableData)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <SortTh col="claim_id"         label="Claim ID"   sort={sort} onSort={handleSort} />
                <SortTh col="submitted_date"   label="Date"       sort={sort} onSort={handleSort} />
                <SortTh col="claim_type"       label="Type"       sort={sort} onSort={handleSort} />
                <SortTh col="diagnosis_icd10"  label="Diagnosis"  sort={sort} onSort={handleSort} />
                <SortTh col="insurer"          label="Insurer"    sort={sort} onSort={handleSort} />
                <SortTh col="submitted_amount" label="Submitted"  sort={sort} onSort={handleSort} />
                <SortTh col="approved_amount"  label="Approved"   sort={sort} onSort={handleSort} />
                <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">No claims match the selected filters.</td></tr>
              ) : pageRows.map((c) => (
                <tr key={c.claim_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.claim_id}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.submitted_date}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: (TYPE_COLORS[c.claim_type] ?? "#94a3b8") + "22", color: TYPE_COLORS[c.claim_type] ?? "#64748b" }}
                    >
                      {c.claim_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">
                    <span className="font-mono text-slate-400 mr-1">{c.diagnosis_icd10}</span>
                    {ICD10_LABELS[c.diagnosis_icd10] ?? ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{c.insurer}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{fmt(c.submitted_amount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700">
                    {c.approved_amount > 0 ? fmt(c.approved_amount) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {tableData.length === 0 ? "0" : `${(page - 1) * PAGE_SZ + 1}–${Math.min(page * PAGE_SZ, tableData.length)}`} of {tableData.length.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
