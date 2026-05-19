import { useState, useRef, useEffect, useCallback } from "react";
import {
  icd10Codes,
  providers,
  documentSchema,
  type ClaimType,
  type Icd10Code,
  mockMember,
} from "@/lib/challenge-07/data";
import type { WizardState, UploadedFile } from "./page";

// ── Shared input styles ───────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400";
const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Step 1 — Claim Type ───────────────────────────────────────────
const claimTypeOptions: {
  type: ClaimType;
  icon: string;
  label: string;
  desc: string;
  color: string;
}[] = [
  {
    type: "OUTPATIENT",
    icon: "🏥",
    label: "Outpatient",
    desc: "Doctor visits, consultations, medication",
    color: "border-blue-300 bg-blue-50 text-blue-700",
  },
  {
    type: "INPATIENT",
    icon: "🛏️",
    label: "Inpatient",
    desc: "Hospital admission, surgery, overnight stay",
    color: "border-violet-300 bg-violet-50 text-violet-700",
  },
  {
    type: "DENTAL",
    icon: "🦷",
    label: "Dental",
    desc: "Cleaning, fillings, extractions, major dental work",
    color: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
];

export function Step1ClaimType({
  state,
  onSelect,
}: {
  state: WizardState;
  onSelect: (t: ClaimType) => void;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-1">
        Select Claim Type
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Choose the type of medical claim you are submitting.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {claimTypeOptions.map((opt) => (
          <button
            key={opt.type}
            onClick={() => onSelect(opt.type)}
            className={`rounded-xl border-2 p-5 text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              state.claimType === opt.type
                ? opt.color + " shadow-md"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="text-3xl mb-3">{opt.icon}</div>
            <div className="font-semibold text-slate-800 mb-1">{opt.label}</div>
            <div className="text-xs text-slate-500 leading-relaxed">
              {opt.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2 — Member & Policy Info ─────────────────────────────────
export function Step2Member({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState["member"]>) => void;
}) {
  const { member } = state;
  const deps = mockMember.dependents;
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-1">
        Member & Policy Information
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Pre-filled from your profile. You may edit if needed.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Member Name" required>
          <input
            className={inputCls}
            value={member.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>
        <Field label="Policy Number" required>
          <input
            className={inputCls}
            value={member.policyNumber}
            onChange={(e) => onChange({ policyNumber: e.target.value })}
          />
        </Field>
        <Field label="Member ID" required>
          <input
            className={inputCls}
            value={member.memberId}
            onChange={(e) => onChange({ memberId: e.target.value })}
          />
        </Field>
        <Field label="Date of Birth" required>
          <input
            type="date"
            className={inputCls}
            value={member.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100">
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={member.forDependent}
            onChange={(e) =>
              onChange({ forDependent: e.target.checked, dependentId: "" })
            }
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">
            This claim is for a dependent
          </span>
        </label>

        {member.forDependent && (
          <div className="mt-3 max-w-xs">
            <Field label="Select Dependent" required>
              <select
                className={inputCls}
                value={member.dependentId}
                onChange={(e) => onChange({ dependentId: e.target.value })}
              >
                <option value="">— Select dependent —</option>
                {deps.map(
                  (d: {
                    id: string;
                    name: string;
                    relation: string;
                    dob: string;
                  }) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.relation}, DOB: {d.dob})
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ICD-10 Autocomplete ───────────────────────────────────────────
function Icd10Autocomplete({
  value,
  description,
  onSelect,
}: {
  value: string;
  description: string;
  onSelect: (code: Icd10Code) => void;
}) {
  const [query, setQuery] = useState(value ? `${value} — ${description}` : "");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const results =
    query.trim() && !value
      ? icd10Codes
          .filter(
            (c) =>
              c.code.toLowerCase().startsWith(query.toLowerCase()) ||
              c.description.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 10)
      : [];

  useEffect(() => {
    if (value && description) {
      setTimeout(() => {
        setQuery(`${value} — ${description}`);
      }, 0);
    }
  }, [value, description]);

  const handleSelect = useCallback(
    (code: Icd10Code) => {
      setQuery(`${code.code} — ${code.description}`);
      setOpen(false);
      onSelect(code);
    },
    [onSelect],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[cursor]);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        className={inputCls}
        value={query}
        placeholder="Type code or diagnosis name (e.g. J06 or bronchitis)"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setCursor(0);
          if (!e.target.value) onSelect({ code: "", description: "" });
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((c, i) => (
            <button
              key={c.code}
              type="button"
              onMouseDown={() => handleSelect(c)}
              className={`w-full text-left px-3 py-2.5 flex gap-2 text-sm transition-colors ${i === cursor ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"}`}
            >
              <span className="font-mono font-semibold shrink-0 w-20">
                {c.code}
              </span>
              <span className="truncate">{c.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Provider Autocomplete ─────────────────────────────────────────
function ProviderInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions =
    value.length >= 2
      ? providers
          .filter((p) => p.name.toLowerCase().includes(value.toLowerCase()))
          .slice(0, 8)
      : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        className={inputCls}
        value={value}
        placeholder="Start typing hospital or clinic name"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((p) => (
            <button
              key={p.name}
              type="button"
              onMouseDown={() => {
                onChange(p.name);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
            >
              <span>{p.name}</span>
              <span className="text-xs text-slate-400 capitalize">
                {p.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 3 — Diagnosis & Treatment ────────────────────────────────
export function Step3Treatment({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState["treatment"]>) => void;
}) {
  const { treatment, claimType } = state;
  const isIPD = claimType === "INPATIENT";

  const lengthOfStay =
    isIPD && treatment.admissionDate && treatment.dischargeDate
      ? Math.max(
          0,
          Math.round(
            (new Date(treatment.dischargeDate).getTime() -
              new Date(treatment.admissionDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null;

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-1">
        Diagnosis & Treatment
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Describe the medical condition and treatment details.
      </p>

      <div className="space-y-4">
        <Field label="Diagnosis Description" required>
          <textarea
            className={inputCls + " resize-none"}
            rows={2}
            value={treatment.diagnosis}
            placeholder="Brief description of the medical condition"
            onChange={(e) => onChange({ diagnosis: e.target.value })}
          />
        </Field>

        <Field label="ICD-10 Code" required>
          <Icd10Autocomplete
            value={treatment.icd10Code}
            description={treatment.icd10Description}
            onSelect={(c) =>
              onChange({ icd10Code: c.code, icd10Description: c.description })
            }
          />
          {treatment.icd10Code && (
            <p className="text-xs text-slate-400 mt-1 pl-1">
              {treatment.icd10Description}
            </p>
          )}
        </Field>

        {isIPD ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Admission Date" required>
              <input
                type="date"
                className={inputCls}
                value={treatment.admissionDate}
                onChange={(e) => onChange({ admissionDate: e.target.value })}
              />
            </Field>
            <Field label="Discharge Date" required>
              <input
                type="date"
                className={inputCls}
                value={treatment.dischargeDate}
                min={treatment.admissionDate}
                onChange={(e) => onChange({ dischargeDate: e.target.value })}
              />
            </Field>
            {lengthOfStay !== null && (
              <div className="sm:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                  <span className="text-blue-600">🏥</span>
                  <span className="font-semibold text-blue-800">
                    {lengthOfStay} day{lengthOfStay !== 1 ? "s" : ""}
                  </span>
                  <span className="text-blue-600">length of stay</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Field label="Treatment Date" required>
            <input
              type="date"
              className={inputCls}
              value={treatment.treatmentDate}
              onChange={(e) => onChange({ treatmentDate: e.target.value })}
            />
          </Field>
        )}

        <Field label="Hospital / Provider" required>
          <ProviderInput
            value={treatment.provider}
            onChange={(v) => onChange({ provider: v })}
          />
        </Field>

        {isIPD && (
          <Field label="Admission Reason" required>
            <textarea
              className={inputCls + " resize-none"}
              rows={2}
              value={treatment.admissionReason}
              placeholder="Reason for hospital admission"
              onChange={(e) => onChange({ admissionReason: e.target.value })}
            />
          </Field>
        )}
      </div>
    </div>
  );
}

// ── Step 4 — Document Upload ──────────────────────────────────────
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const MAX_SIZE_MB = 10;

interface DocSlotProps {
  docName: string;
  required: boolean;
  uploaded: UploadedFile | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

function DocSlot({
  docName,
  required,
  uploaded,
  onFileSelect,
  onRemove,
}: DocSlotProps) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PDF, JPG, PNG files are accepted.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB limit.`);
      return;
    }
    onFileSelect(file);
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        uploaded?.progress === 100
          ? "border-emerald-200 bg-emerald-50/50"
          : error
            ? "border-red-200 bg-red-50/50"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-sm font-semibold text-slate-800">
            {docName}
          </span>
          <span
            className={`ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
              required
                ? "bg-red-100 text-red-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {required ? "Required" : "Optional"}
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            PDF, JPG, PNG · max {MAX_SIZE_MB}MB
          </p>
        </div>
        {uploaded?.progress === 100 ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-emerald-600 text-lg">✓</span>
            <button
              onClick={() => {
                onRemove();
                setError(null);
              }}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              title="Remove file"
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
          >
            Choose file
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleChange}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />

      {uploaded && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span className="truncate max-w-[180px]">{uploaded.name}</span>
            <span>{uploaded.progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${uploaded.progress === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
              style={{ width: `${uploaded.progress}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

export function Step4Documents({
  state,
  onFileSelect,
  onRemove,
}: {
  state: WizardState;
  onFileSelect: (docName: string, file: File) => void;
  onRemove: (docName: string) => void;
}) {
  const schema = state.claimType ? documentSchema[state.claimType] : [];
  const requiredCount = schema.filter((d) => d.required).length;
  const completedRequired = schema.filter(
    (d) => d.required && state.documents[d.name]?.progress === 100,
  ).length;

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-1">
        Document Upload
      </h2>
      <p className="text-sm text-slate-500 mb-2">
        Upload the required documents for your{" "}
        <strong>{state.claimType?.toLowerCase()}</strong> claim.
      </p>
      <div className="mb-5 text-xs text-slate-500 flex items-center gap-1.5">
        <span
          className={`font-semibold ${completedRequired === requiredCount ? "text-emerald-600" : "text-amber-600"}`}
        >
          {completedRequired}/{requiredCount}
        </span>
        required documents uploaded
      </div>

      <div className="space-y-3">
        {schema.map((doc) => (
          <DocSlot
            key={doc.name}
            docName={doc.name}
            required={doc.required}
            uploaded={state.documents[doc.name] ?? null}
            onFileSelect={(file) => onFileSelect(doc.name, file)}
            onRemove={() => onRemove(doc.name)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Step 5 — Review & Submit ──────────────────────────────────────
function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <button
          onClick={onEdit}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Edit
        </button>
      </div>
      <dl className="px-4 py-3 space-y-2">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="text-slate-800 font-medium text-right">{value || "—"}</dd>
    </div>
  );
}

export function Step5Review({
  state,
  onEditStep,
  onConfirmChange,
  onSubmit,
  submitted,
  claimRef,
}: {
  state: WizardState;
  onEditStep: (step: number) => void;
  onConfirmChange: (v: boolean) => void;
  onSubmit: () => void;
  submitted: boolean;
  claimRef: string;
}) {
  const { member, treatment, claimType } = state;
  const isIPD = claimType === "INPATIENT";

  const lengthOfStay =
    isIPD && treatment.admissionDate && treatment.dischargeDate
      ? Math.max(
          0,
          Math.round(
            (new Date(treatment.dischargeDate).getTime() -
              new Date(treatment.admissionDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null;

  const uploadedDocs = Object.entries(state.documents)
    .filter(([, f]) => f?.progress === 100)
    .map(([name]) => name);

  if (submitted) {
    const ref = claimRef;
    return (
      <div className="text-center py-10">
        <div className="inline-flex w-16 h-16 rounded-full bg-emerald-100 items-center justify-center text-3xl mb-4">
          ✓
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Claim Submitted Successfully
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Your claim has been received and is being processed.
        </p>
        <div className="inline-block bg-slate-50 border border-slate-200 rounded-lg px-6 py-3">
          <div className="text-xs text-slate-400 mb-1">
            Claim Reference Number
          </div>
          <div className="text-lg font-bold font-mono text-slate-800">
            {ref}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          You will receive a confirmation email within 2 business days.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-1">
        Review & Submit
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Review all information before submitting your claim.
      </p>

      <div className="space-y-3 mb-6">
        <ReviewSection title="Claim Type" onEdit={() => onEditStep(0)}>
          <Row label="Type" value={claimType ?? "—"} />
        </ReviewSection>

        <ReviewSection title="Member Information" onEdit={() => onEditStep(1)}>
          <Row label="Name" value={member.name} />
          <Row label="Policy Number" value={member.policyNumber} />
          <Row label="Member ID" value={member.memberId} />
          <Row label="Date of Birth" value={member.dateOfBirth} />
          {member.forDependent && <Row label="Claimant" value="Dependent" />}
        </ReviewSection>

        <ReviewSection
          title="Diagnosis & Treatment"
          onEdit={() => onEditStep(2)}
        >
          <Row label="Diagnosis" value={treatment.diagnosis} />
          <Row
            label="ICD-10 Code"
            value={
              treatment.icd10Code
                ? `${treatment.icd10Code} — ${treatment.icd10Description}`
                : ""
            }
          />
          {isIPD ? (
            <>
              <Row label="Admission Date" value={treatment.admissionDate} />
              <Row label="Discharge Date" value={treatment.dischargeDate} />
              {lengthOfStay !== null && (
                <Row
                  label="Length of Stay"
                  value={`${lengthOfStay} day${lengthOfStay !== 1 ? "s" : ""}`}
                />
              )}
              <Row label="Admission Reason" value={treatment.admissionReason} />
            </>
          ) : (
            <Row label="Treatment Date" value={treatment.treatmentDate} />
          )}
          <Row label="Provider" value={treatment.provider} />
        </ReviewSection>

        <ReviewSection title="Documents" onEdit={() => onEditStep(3)}>
          {uploadedDocs.length === 0 ? (
            <p className="text-sm text-slate-400">No documents uploaded.</p>
          ) : (
            uploadedDocs.map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 text-sm text-slate-700"
              >
                <span className="text-emerald-500">✓</span> {name}
              </div>
            ))
          )}
        </ReviewSection>
      </div>

      <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <input
          type="checkbox"
          checked={state.confirmed}
          onChange={(e) => onConfirmChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-700">
          I confirm that all information provided is accurate and complete. I
          understand that false or misleading information may result in claim
          denial.
        </span>
      </label>

      <button
        onClick={onSubmit}
        disabled={!state.confirmed}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600"
      >
        Submit Claim
      </button>
    </div>
  );
}
