"use client";

import { useState, useEffect, useCallback } from "react";
import type { WorkflowClaim, TransitionDef, AuditEntry, ClaimState, AuthRole } from "@/lib/challenge-14/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type ClaimSummary = { id: string; state: ClaimState; pendingInfoCount: number; updatedAt: string };
type ClaimDetail = WorkflowClaim & { availableTransitions: TransitionDef[] };
type Tab = "workflow" | "audit";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATE_ORDER: ClaimState[] = [
  "SUBMITTED", "DOCUMENTS_VERIFIED", "UNDER_ASSESSMENT",
  "PENDING_INFO", "APPROVED", "REJECTED", "PAYMENT_INITIATED", "CLOSED",
];

const STATE_COLORS: Record<ClaimState, string> = {
  SUBMITTED:           "bg-gray-100 text-gray-700 ring-gray-200",
  DOCUMENTS_VERIFIED:  "bg-sky-100 text-sky-700 ring-sky-200",
  UNDER_ASSESSMENT:    "bg-amber-100 text-amber-700 ring-amber-200",
  PENDING_INFO:        "bg-orange-100 text-orange-700 ring-orange-200",
  APPROVED:            "bg-emerald-100 text-emerald-700 ring-emerald-200",
  REJECTED:            "bg-red-100 text-red-700 ring-red-200",
  PAYMENT_INITIATED:   "bg-violet-100 text-violet-700 ring-violet-200",
  CLOSED:              "bg-slate-100 text-slate-600 ring-slate-200",
};

const ROLE_COLORS: Record<AuthRole, string> = {
  document_clerk: "bg-sky-50 text-sky-700",
  team_lead:      "bg-amber-50 text-amber-700",
  assessor:       "bg-violet-50 text-violet-700",
  finance:        "bg-emerald-50 text-emerald-700",
  system:         "bg-slate-100 text-slate-600",
};

const BASE = "/api/challenge-14/v1";

// ── Context fields per target state ──────────────────────────────────────────

type ContextFields = {
  documents?: boolean;
  assessorAssigned?: boolean;
  assessmentReport?: boolean;
  rejectionReason?: boolean;
  missingInfoDescription?: boolean;
  paymentRequestCreated?: boolean;
  paymentConfirmed?: boolean;
  appealPeriodExpired?: boolean;
  memberAcknowledged?: boolean;
  policyLimit?: boolean;
  claimAmount?: boolean;
};

const CONTEXT_FIELDS: Partial<Record<ClaimState, ContextFields>> = {
  DOCUMENTS_VERIFIED:  { documents: true },
  UNDER_ASSESSMENT:    { assessorAssigned: true },
  APPROVED:            { assessmentReport: true, policyLimit: true, claimAmount: true },
  REJECTED:            { assessmentReport: true, rejectionReason: true },
  PENDING_INFO:        { missingInfoDescription: true },
  PAYMENT_INITIATED:   { paymentRequestCreated: true },
  CLOSED:              { paymentConfirmed: true, appealPeriodExpired: true, memberAcknowledged: true },
};

// ── Transition form ───────────────────────────────────────────────────────────

type FormState = {
  userId: string;
  role: AuthRole;
  reason: string;
  documents: string;
  assessorAssigned: string;
  assessmentReport: string;
  rejectionReason: string;
  missingInfoDescription: string;
  paymentRequestCreated: boolean;
  paymentConfirmed: boolean;
  appealPeriodExpired: boolean;
  memberAcknowledged: boolean;
  policyLimit: string;
  claimAmount: string;
};

function defaultForm(role: AuthRole): FormState {
  return {
    userId: `user-${role.split("_")[0]}`,
    role,
    reason: "",
    documents: "",
    assessorAssigned: "",
    assessmentReport: "",
    rejectionReason: "",
    missingInfoDescription: "",
    paymentRequestCreated: false,
    paymentConfirmed: false,
    appealPeriodExpired: false,
    memberAcknowledged: false,
    policyLimit: "",
    claimAmount: "",
  };
}

function TransitionForm({
  transition,
  onSubmit,
  onCancel,
}: {
  transition: TransitionDef;
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    defaultForm(transition.authorizedRoles[0]),
  );
  const fields = CONTEXT_FIELDS[transition.to] ?? {};
  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Execute: {transition.from} → {transition.to}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">userId</label>
          <input
            value={form.userId}
            onChange={(e) => set("userId", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">role</label>
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {(["document_clerk", "team_lead", "assessor", "finance", "system"] as AuthRole[]).map(
              (r) => <option key={r} value={r}>{r}</option>,
            )}
          </select>
        </div>
      </div>

      {fields.documents && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">documents (comma-separated)</label>
          <input
            value={form.documents}
            onChange={(e) => set("documents", e.target.value)}
            placeholder="medical_receipt, lab_results"
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {fields.assessorAssigned && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">assessorAssigned</label>
          <input
            value={form.assessorAssigned}
            onChange={(e) => set("assessorAssigned", e.target.value)}
            placeholder="assessor-007"
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {fields.assessmentReport && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">assessmentReport</label>
          <input
            value={form.assessmentReport}
            onChange={(e) => set("assessmentReport", e.target.value)}
            placeholder="Assessment findings..."
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {fields.rejectionReason && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">rejectionReason</label>
          <input
            value={form.rejectionReason}
            onChange={(e) => set("rejectionReason", e.target.value)}
            placeholder="Reason for rejection..."
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {fields.missingInfoDescription && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">missingInfoDescription</label>
          <input
            value={form.missingInfoDescription}
            onChange={(e) => set("missingInfoDescription", e.target.value)}
            placeholder="What information is missing..."
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {(fields.policyLimit || fields.claimAmount) && (
        <div className="grid grid-cols-2 gap-2">
          {fields.policyLimit && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">policyLimit (optional)</label>
              <input
                type="number"
                value={form.policyLimit}
                onChange={(e) => set("policyLimit", e.target.value)}
                placeholder="50000"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
          {fields.claimAmount && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">claimAmount (optional)</label>
              <input
                type="number"
                value={form.claimAmount}
                onChange={(e) => set("claimAmount", e.target.value)}
                placeholder="30000"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
        </div>
      )}

      {fields.paymentRequestCreated && (
        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.paymentRequestCreated}
            onChange={(e) => set("paymentRequestCreated", e.target.checked)}
            className="rounded"
          />
          paymentRequestCreated
        </label>
      )}

      {fields.paymentConfirmed && (
        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.paymentConfirmed}
            onChange={(e) => set("paymentConfirmed", e.target.checked)}
            className="rounded"
          />
          paymentConfirmed
        </label>
      )}

      {(fields.appealPeriodExpired || fields.memberAcknowledged) && (
        <div className="flex gap-4">
          {fields.appealPeriodExpired && (
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.appealPeriodExpired}
                onChange={(e) => set("appealPeriodExpired", e.target.checked)}
                className="rounded"
              />
              appealPeriodExpired
            </label>
          )}
          {fields.memberAcknowledged && (
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.memberAcknowledged}
                onChange={(e) => set("memberAcknowledged", e.target.checked)}
                className="rounded"
              />
              memberAcknowledged
            </label>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">reason (optional)</label>
        <input
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
          placeholder="Add a note..."
          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSubmit(form)}
          className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          Execute Transition
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Challenge14Client() {
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [selected, setSelected] = useState<ClaimDetail | null>(null);
  const [tab, setTab] = useState<Tab>("workflow");
  const [activeTransition, setActiveTransition] = useState<TransitionDef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newLimit, setNewLimit] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const fetchClaims = useCallback(async () => {
    const res = await fetch(`${BASE}/claims`);
    setClaims(await res.json());
  }, []);

  const fetchClaim = useCallback(async (id: string) => {
    const res = await fetch(`${BASE}/claims/${id}`);
    if (res.ok) setSelected(await res.json());
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  async function createClaim() {
    setCreating(true);
    const body: Record<string, number> = {};
    if (newLimit) body.policyLimit = Number(newLimit);
    if (newAmount) body.claimAmount = Number(newAmount);
    const res = await fetch(`${BASE}/claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const claim = await res.json();
    setCreating(false);
    setNewLimit("");
    setNewAmount("");
    await fetchClaims();
    await fetchClaim(claim.id);
    setTab("workflow");
  }

  async function executeTransitionFn(transition: TransitionDef, form: FormState) {
    if (!selected) return;
    setError(null);

    const body: Record<string, unknown> = {
      to: transition.to,
      triggeredBy: { userId: form.userId, role: form.role },
    };
    if (form.reason) body.reason = form.reason;
    if (form.documents) body.documents = form.documents.split(",").map((d) => d.trim()).filter(Boolean);
    if (form.assessorAssigned) body.assessorAssigned = form.assessorAssigned;
    if (form.assessmentReport) body.assessmentReport = form.assessmentReport;
    if (form.rejectionReason) body.rejectionReason = form.rejectionReason;
    if (form.missingInfoDescription) body.missingInfoDescription = form.missingInfoDescription;
    if (form.paymentRequestCreated) body.paymentRequestCreated = true;
    if (form.paymentConfirmed) body.paymentConfirmed = true;
    if (form.appealPeriodExpired) body.appealPeriodExpired = true;
    if (form.memberAcknowledged) body.memberAcknowledged = true;
    if (form.policyLimit) body.policyLimit = Number(form.policyLimit);
    if (form.claimAmount) body.claimAmount = Number(form.claimAmount);

    const res = await fetch(`${BASE}/claims/${selected.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error ?? "Transition failed");
      return;
    }

    setActiveTransition(null);
    await fetchClaims();
    await fetchClaim(selected.id);
  }

  const stateIndex = selected ? STATE_ORDER.indexOf(selected.state) : -1;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-1">Challenge 14</p>
        <h1 className="text-2xl font-bold text-gray-900">Claims Workflow Orchestrator</h1>
        <p className="mt-1 text-sm text-gray-500">
          State machine-based claim lifecycle with preconditions, role-based authorization, and immutable audit trail.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left: Claims list */}
        <div className="w-72 shrink-0 space-y-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Claim</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">policyLimit</label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="50000"
                  className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">claimAmount</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="30000"
                  className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <button
              onClick={createClaim}
              disabled={creating}
              className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {creating ? "Creating…" : "+ New Claim"}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {claims.length === 0 && (
              <p className="text-xs text-gray-400 p-4 text-center">No claims yet</p>
            )}
            {claims.map((c) => (
              <button
                key={c.id}
                onClick={async () => { setError(null); setActiveTransition(null); await fetchClaim(c.id); setTab("workflow"); }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-gray-500 truncate">{c.id}</span>
                  {c.pendingInfoCount > 0 && (
                    <span className="text-[10px] text-orange-600 font-bold shrink-0">×{c.pendingInfoCount}</span>
                  )}
                </div>
                <span className={`mt-1 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ring-1 ${STATE_COLORS[c.state]}`}>
                  {c.state.replace(/_/g, " ")}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Detail */}
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 min-h-[300px]">
            Select or create a claim to see its workflow
          </div>
        ) : (
          <div className="flex-1 space-y-4">
            {/* State header */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-gray-400">{selected.id}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-full ring-1 ${STATE_COLORS[selected.state]}`}>
                      {selected.state.replace(/_/g, " ")}
                    </span>
                    {selected.pendingInfoCount > 0 && (
                      <span className="text-xs text-orange-600">
                        Info requests: {selected.pendingInfoCount}/3
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* State pipeline */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {STATE_ORDER.map((s, i) => {
                  const isCurrent = s === selected.state;
                  const isDone = i < stateIndex && s !== "PENDING_INFO" && s !== "REJECTED";
                  return (
                    <div key={s} className="flex items-center gap-1 shrink-0">
                      <div
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ring-1 transition-all ${
                          isCurrent
                            ? `${STATE_COLORS[s]} ring-2 scale-110`
                            : isDone
                            ? "bg-gray-100 text-gray-400 ring-gray-100 opacity-60"
                            : "bg-gray-50 text-gray-300 ring-gray-100"
                        }`}
                      >
                        {isDone ? "✓ " : ""}{s.replace(/_/g, " ")}
                      </div>
                      {i < STATE_ORDER.length - 1 && (
                        <span className="text-gray-200 text-[10px]">›</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-100">
              {(["workflow", "audit"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px capitalize ${
                    tab === t
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "workflow" ? "Workflow" : "Audit Trail"}
                </button>
              ))}
            </div>

            {/* Workflow tab */}
            {tab === "workflow" && (
              <div className="space-y-3">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
                    {error}
                  </div>
                )}

                {selected.availableTransitions.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-6 text-center text-xs text-gray-400">
                    Claim is in terminal state — no further transitions available.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Available transitions:</p>
                    {selected.availableTransitions.map((t) => (
                      <div key={`${t.from}-${t.to}`} className="bg-white rounded-xl border border-gray-100 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ring-1 ${STATE_COLORS[t.to]}`}>
                              → {t.to.replace(/_/g, " ")}
                            </span>
                            <div className="flex gap-1 flex-wrap">
                              {t.authorizedRoles.map((r) => (
                                <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[r]}`}>
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setActiveTransition(activeTransition?.to === t.to ? null : t)
                            }
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                              activeTransition?.to === t.to
                                ? "bg-gray-100 text-gray-600"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }`}
                          >
                            {activeTransition?.to === t.to ? "Cancel" : "Execute →"}
                          </button>
                        </div>
                        {t.preconditions.length > 0 && (
                          <p className="text-[10px] text-gray-400 mt-1.5">
                            Preconditions: {t.preconditions.join(", ")}
                          </p>
                        )}
                        {activeTransition?.to === t.to && (
                          <TransitionForm
                            transition={t}
                            onSubmit={(form) => executeTransitionFn(t, form)}
                            onCancel={() => setActiveTransition(null)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Audit Trail tab */}
            {tab === "audit" && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {selected.auditTrail.length === 0 ? (
                  <p className="text-xs text-gray-400 p-6 text-center">No transitions yet.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold text-gray-500">Timestamp</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-500">Transition</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-500">By</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-500">Side effects</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...selected.auditTrail].reverse().map((entry: AuditEntry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-400 font-mono whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-gray-500">{entry.fromState.replace(/_/g, " ")}</span>
                            <span className="text-gray-300 mx-1">→</span>
                            <span className={`font-semibold px-1.5 py-0.5 rounded-full ring-1 ${STATE_COLORS[entry.toState]}`}>
                              {entry.toState.replace(/_/g, " ")}
                            </span>
                            {entry.reason && (
                              <p className="text-gray-400 mt-0.5 italic">{entry.reason}</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-gray-700">{entry.triggeredBy.userId}</span>
                            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[entry.triggeredBy.role]}`}>
                              {entry.triggeredBy.role}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-400">
                            {entry.sideEffectsExecuted.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
