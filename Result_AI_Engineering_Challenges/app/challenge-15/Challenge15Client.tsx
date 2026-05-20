"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Tenant,
  TenantPlan,
  ResolvedConfigEntry,
  EvaluatedFlag,
  ConfigVersion,
  ConfigDiff,
  ConfigValue,
} from "@/lib/challenge-15/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type TenantSummary = { id: string; name: string; plan: TenantPlan; environment: string; updatedAt: string };
type ConfigData = { resolvedConfig: ResolvedConfigEntry[]; evaluatedFlags: EvaluatedFlag[] };
type Tab = "config" | "history";

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE = "/api/challenge-15/v1";

const PLAN_COLORS: Record<TenantPlan, string> = {
  basic:      "bg-gray-100 text-gray-700 ring-gray-200",
  standard:   "bg-sky-100 text-sky-700 ring-sky-200",
  enterprise: "bg-violet-100 text-violet-700 ring-violet-200",
};

const SOURCE_COLORS: Record<string, string> = {
  global: "bg-slate-100 text-slate-500",
  plan:   "bg-sky-50 text-sky-600",
  tenant: "bg-amber-50 text-amber-700",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatValue(v: ConfigValue | boolean | undefined): string {
  if (v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

// ── Override editor ───────────────────────────────────────────────────────────

function OverrideEditor({
  configOverrides,
  flagOverrides,
  onSave,
  onCancel,
}: {
  configOverrides: Record<string, ConfigValue>;
  flagOverrides: Record<string, boolean>;
  onSave: (cfg: Record<string, ConfigValue>, flags: Record<string, boolean>, changedBy: string, desc: string) => void;
  onCancel: () => void;
}) {
  const [cfg, setCfg] = useState(
    Object.entries(configOverrides).map(([k, v]) => ({ k, v: String(v) })),
  );
  const [flags, setFlags] = useState(
    Object.entries(flagOverrides).map(([k, v]) => ({ k, v })),
  );
  const [changedBy, setChangedBy] = useState("admin");
  const [desc, setDesc] = useState("");
  const [newCfgKey, setNewCfgKey] = useState("");
  const [newCfgVal, setNewCfgVal] = useState("");
  const [newFlagKey, setNewFlagKey] = useState("");

  function parseCfgValue(s: string): ConfigValue {
    const n = Number(s);
    if (!isNaN(n) && s.trim() !== "") return n;
    if (s === "true") return true;
    if (s === "false") return false;
    return s;
  }

  function submit() {
    const cfgMap: Record<string, ConfigValue> = {};
    for (const { k, v } of cfg) if (k) cfgMap[k] = parseCfgValue(v);
    const flagMap: Record<string, boolean> = {};
    for (const { k, v } of flags) if (k) flagMap[k] = v;
    onSave(cfgMap, flagMap, changedBy, desc || "Manual config update");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <h3 className="text-sm font-semibold text-gray-700">Edit Config Overrides</h3>

      {/* Config overrides */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500">Config values</p>
        {cfg.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={row.k}
              onChange={(e) => setCfg((c) => c.map((r, j) => j === i ? { ...r, k: e.target.value } : r))}
              placeholder="key"
              className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <input
              value={row.v}
              onChange={(e) => setCfg((c) => c.map((r, j) => j === i ? { ...r, v: e.target.value } : r))}
              placeholder="value"
              className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button onClick={() => setCfg((c) => c.filter((_, j) => j !== i))} className="text-red-400 text-xs hover:text-red-600">✕</button>
          </div>
        ))}
        <div className="flex gap-2">
          <input value={newCfgKey} onChange={(e) => setNewCfgKey(e.target.value)} placeholder="new key" className="flex-1 rounded border border-dashed border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <input value={newCfgVal} onChange={(e) => setNewCfgVal(e.target.value)} placeholder="value" className="flex-1 rounded border border-dashed border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <button
            onClick={() => { if (newCfgKey) { setCfg((c) => [...c, { k: newCfgKey, v: newCfgVal }]); setNewCfgKey(""); setNewCfgVal(""); } }}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >+ Add</button>
        </div>
      </div>

      {/* Flag overrides */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500">Feature flag overrides</p>
        {flags.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={row.k}
              onChange={(e) => setFlags((f) => f.map((r, j) => j === i ? { ...r, k: e.target.value } : r))}
              placeholder="flag key"
              className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <select
              value={String(row.v)}
              onChange={(e) => setFlags((f) => f.map((r, j) => j === i ? { ...r, v: e.target.value === "true" } : r))}
              className="rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="true">enabled</option>
              <option value="false">disabled</option>
            </select>
            <button onClick={() => setFlags((f) => f.filter((_, j) => j !== i))} className="text-red-400 text-xs hover:text-red-600">✕</button>
          </div>
        ))}
        <div className="flex gap-2">
          <input value={newFlagKey} onChange={(e) => setNewFlagKey(e.target.value)} placeholder="new flag key" className="flex-1 rounded border border-dashed border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <button
            onClick={() => { if (newFlagKey) { setFlags((f) => [...f, { k: newFlagKey, v: false }]); setNewFlagKey(""); } }}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >+ Add</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">changedBy</label>
          <input value={changedBy} onChange={(e) => setChangedBy(e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">description</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What changed?" className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={submit} className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">Save Changes</button>
        <button onClick={onCancel} className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ── Diff view ─────────────────────────────────────────────────────────────────

function DiffView({ diffs }: { diffs: ConfigDiff[] }) {
  if (diffs.length === 0) {
    return <p className="text-xs text-gray-400 italic">No differences from current config.</p>;
  }
  const TYPE_STYLE: Record<string, string> = {
    added:   "bg-emerald-50 border-emerald-200 text-emerald-700",
    changed: "bg-amber-50 border-amber-200 text-amber-700",
    removed: "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className="space-y-1">
      {diffs.map((d) => (
        <div key={d.key} className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border text-xs font-mono ${TYPE_STYLE[d.type]}`}>
          <span className="w-16 font-bold uppercase shrink-0">{d.type}</span>
          <span className="font-semibold">{d.key}</span>
          <span className="opacity-60">{formatValue(d.from)} → {formatValue(d.to)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Challenge15Client() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [versions, setVersions] = useState<ConfigVersion[]>([]);
  const [tab, setTab] = useState<Tab>("config");
  const [editing, setEditing] = useState(false);
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<Record<string, ConfigDiff[]>>({});

  // New tenant form
  const [newName, setNewName] = useState("");
  const [newPlan, setNewPlan] = useState<TenantPlan>("basic");
  const [newEnv, setNewEnv] = useState<"sandbox" | "production">("sandbox");
  const [creating, setCreating] = useState(false);

  const fetchTenants = useCallback(async () => {
    const res = await fetch(`${BASE}/tenants`);
    setTenants(await res.json());
  }, []);

  const fetchSelected = useCallback(async (id: string) => {
    const [tenantRes, cfgRes, verRes] = await Promise.all([
      fetch(`${BASE}/tenants/${id}`),
      fetch(`${BASE}/tenants/${id}/config`),
      fetch(`${BASE}/tenants/${id}/versions`),
    ]);
    setSelected(await tenantRes.json());
    setConfigData(await cfgRes.json());
    setVersions(await verRes.json());
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  async function createTenant() {
    if (!newName) return;
    setCreating(true);
    const res = await fetch(`${BASE}/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, plan: newPlan, environment: newEnv }),
    });
    const t = await res.json();
    setCreating(false);
    setNewName("");
    await fetchTenants();
    await fetchSelected(t.id);
    setTab("config");
  }

  async function saveConfig(
    configOverrides: Record<string, ConfigValue>,
    flagOverrides: Record<string, boolean>,
    changedBy: string,
    description: string,
  ) {
    if (!selected) return;
    await fetch(`${BASE}/tenants/${selected.id}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configOverrides, flagOverrides, changedBy, description }),
    });
    setEditing(false);
    await fetchSelected(selected.id);
    await fetchTenants();
  }

  async function rollback(vid: string) {
    if (!selected) return;
    await fetch(`${BASE}/tenants/${selected.id}/versions/${vid}/rollback`, { method: "POST" });
    await fetchSelected(selected.id);
    await fetchTenants();
    setExpandedDiff(null);
  }

  async function toggleDiff(version: ConfigVersion) {
    if (expandedDiff === version.id) { setExpandedDiff(null); return; }
    if (!selected || !configData) return;

    // Build current config as a fake version to diff against
    const currentVersion: ConfigVersion = {
      id: "current",
      tenantId: selected.id,
      version: 9999,
      configOverrides: selected.configOverrides,
      flagOverrides: selected.flagOverrides,
      createdAt: selected.updatedAt,
      changedBy: "current",
      description: "current",
    };

    // Import engine function via fetch to avoid bundle issues — compute on server
    // Simpler: compute diff client-side using same logic
    const flatA: Record<string, ConfigValue | boolean> = {
      ...version.configOverrides,
      ...Object.fromEntries(Object.entries(version.flagOverrides).map(([k, v]) => [`flag:${k}`, v])),
    };
    const flatB: Record<string, ConfigValue | boolean> = {
      ...currentVersion.configOverrides,
      ...Object.fromEntries(Object.entries(currentVersion.flagOverrides).map(([k, v]) => [`flag:${k}`, v])),
    };
    const allKeys = new Set([...Object.keys(flatA), ...Object.keys(flatB)]);
    const d: ConfigDiff[] = [];
    for (const key of allKeys) {
      const from = flatA[key];
      const to = flatB[key];
      if (from === undefined && to !== undefined) d.push({ key, from: undefined, to, type: "added" });
      else if (from !== undefined && to === undefined) d.push({ key, from, to: undefined, type: "removed" });
      else if (from !== to) d.push({ key, from, to, type: "changed" });
    }
    setDiffs((prev) => ({ ...prev, [version.id]: d.sort((a, b) => a.key.localeCompare(b.key)) }));
    setExpandedDiff(version.id);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-1">Challenge 15</p>
        <h1 className="text-2xl font-bold text-gray-900">Multi-Tenant Configuration Platform</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hierarchical config resolution (global → plan → tenant override) with feature flags, versioning, and rollback.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left: tenant list */}
        <div className="w-72 shrink-0 space-y-3">
          {/* New tenant form */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Tenant</h2>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tenant name"
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Plan</label>
                <select value={newPlan} onChange={(e) => setNewPlan(e.target.value as TenantPlan)} className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="basic">basic</option>
                  <option value="standard">standard</option>
                  <option value="enterprise">enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Env</label>
                <select value={newEnv} onChange={(e) => setNewEnv(e.target.value as "sandbox" | "production")} className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="sandbox">sandbox</option>
                  <option value="production">production</option>
                </select>
              </div>
            </div>
            <button
              onClick={createTenant}
              disabled={creating || !newName}
              className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {creating ? "Creating…" : "+ Create Tenant"}
            </button>
          </div>

          {/* Tenant list */}
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {tenants.length === 0 && (
              <p className="text-xs text-gray-400 p-4 text-center">No tenants yet</p>
            )}
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={async () => { setEditing(false); setExpandedDiff(null); await fetchSelected(t.id); setTab("config"); }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected?.id === t.id ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-800 truncate">{t.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-1 shrink-0 ${PLAN_COLORS[t.plan]}`}>
                    {t.plan}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">{t.environment}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: detail */}
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 min-h-[300px]">
            Select or create a tenant to see its configuration
          </div>
        ) : (
          <div className="flex-1 space-y-4 min-w-0">
            {/* Tenant header */}
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">{selected.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ring-1 ${PLAN_COLORS[selected.plan]}`}>{selected.plan}</span>
                  <span className="text-[11px] text-gray-400">{selected.environment}</span>
                  <span className="text-[11px] font-mono text-gray-300">{selected.id}</span>
                </div>
              </div>
              {!editing && tab === "config" && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  Edit Overrides
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-100">
              {(["config", "history"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setEditing(false); }}
                  className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px capitalize ${
                    tab === t ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "config" ? "Config & Flags" : "Version History"}
                </button>
              ))}
            </div>

            {/* Config tab */}
            {tab === "config" && !editing && configData && (
              <div className="space-y-4">
                {/* Resolved config table */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-50 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-600">Resolved Configuration</p>
                    <p className="text-[10px] text-gray-400">tenant override &gt; plan override &gt; global default</p>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="border-b border-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-500 font-semibold">Key</th>
                        <th className="text-left px-4 py-2 text-gray-500 font-semibold">Value</th>
                        <th className="text-left px-4 py-2 text-gray-500 font-semibold">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {configData.resolvedConfig.map((entry) => (
                        <tr key={entry.key} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-gray-700">{entry.key}</td>
                          <td className="px-4 py-2 font-semibold text-gray-900">{formatValue(entry.value)}</td>
                          <td className="px-4 py-2">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${SOURCE_COLORS[entry.source]}`}>
                              {entry.source}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Feature flags table */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-50 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-600">Feature Flags</p>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="border-b border-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-500 font-semibold">Flag</th>
                        <th className="text-left px-4 py-2 text-gray-500 font-semibold">Status</th>
                        <th className="text-left px-4 py-2 text-gray-500 font-semibold">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {configData.evaluatedFlags.map((flag) => (
                        <tr key={flag.key} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-gray-700">{flag.key}</td>
                          <td className="px-4 py-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${flag.enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                              {flag.enabled ? "enabled" : "disabled"}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${SOURCE_COLORS[flag.source]}`}>
                              {flag.source}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Edit overrides */}
            {tab === "config" && editing && (
              <OverrideEditor
                configOverrides={selected.configOverrides}
                flagOverrides={selected.flagOverrides}
                onSave={saveConfig}
                onCancel={() => setEditing(false)}
              />
            )}

            {/* History tab */}
            {tab === "history" && (
              <div className="space-y-2">
                {versions.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-8 text-center text-xs text-gray-400">
                    No config changes yet. Edit overrides to create the first version.
                  </div>
                ) : (
                  versions.map((v) => (
                    <div key={v.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-gray-500">v{v.version}</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{v.description}</p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(v.createdAt).toLocaleString()} · {v.changedBy}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => toggleDiff(v)}
                            className="px-3 py-1 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            {expandedDiff === v.id ? "Hide diff" : "Diff"}
                          </button>
                          <button
                            onClick={() => rollback(v.id)}
                            className="px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
                          >
                            Rollback
                          </button>
                        </div>
                      </div>
                      {expandedDiff === v.id && diffs[v.id] && (
                        <div className="border-t border-gray-50 px-4 py-3">
                          <p className="text-[10px] text-gray-400 mb-2">Diff from this version to current:</p>
                          <DiffView diffs={diffs[v.id]} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
