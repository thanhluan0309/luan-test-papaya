"use client";

import { useState, useCallback } from "react";
import { mockMember, documentSchema, type ClaimType } from "@/lib/challenge-07/data";
import {
  Step1ClaimType,
  Step2Member,
  Step3Treatment,
  Step4Documents,
  Step5Review,
} from "./steps";

// ── Types ─────────────────────────────────────────────────────────
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  progress: number;
}

export interface WizardState {
  claimType: ClaimType | null;
  member: {
    name: string;
    policyNumber: string;
    memberId: string;
    dateOfBirth: string;
    forDependent: boolean;
    dependentId: string;
  };
  treatment: {
    diagnosis: string;
    icd10Code: string;
    icd10Description: string;
    treatmentDate: string;
    admissionDate: string;
    dischargeDate: string;
    provider: string;
    admissionReason: string;
  };
  documents: Record<string, UploadedFile | null>;
  confirmed: boolean;
}

const initialState: WizardState = {
  claimType: null,
  member: {
    name:          mockMember.name,
    policyNumber:  mockMember.policyNumber,
    memberId:      mockMember.memberId,
    dateOfBirth:   mockMember.dateOfBirth,
    forDependent:  false,
    dependentId:   "",
  },
  treatment: {
    diagnosis:        "",
    icd10Code:        "",
    icd10Description: "",
    treatmentDate:    "",
    admissionDate:    "",
    dischargeDate:    "",
    provider:         "",
    admissionReason:  "",
  },
  documents: {},
  confirmed: false,
};

// ── Step config ───────────────────────────────────────────────────
const STEPS = [
  { label: "Type"      },
  { label: "Member"    },
  { label: "Diagnosis" },
  { label: "Documents" },
  { label: "Review"    },
];

function canProceed(step: number, state: WizardState): boolean {
  const { member, treatment, claimType } = state;
  const isIPD = claimType === "INPATIENT";
  switch (step) {
    case 0:
      return claimType !== null;
    case 1:
      return !!(member.name && member.policyNumber && member.memberId && member.dateOfBirth &&
        (!member.forDependent || member.dependentId));
    case 2:
      return !!(treatment.diagnosis && treatment.icd10Code && treatment.provider &&
        (isIPD
          ? treatment.admissionDate && treatment.dischargeDate && treatment.admissionReason
          : treatment.treatmentDate));
    case 3: {
      if (!claimType) return false;
      const required = documentSchema[claimType].filter(d => d.required);
      return required.every(d => state.documents[d.name]?.progress === 100);
    }
    case 4:
      return state.confirmed;
    default:
      return false;
  }
}

// ── Progress bar ──────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 select-none">
      {STEPS.map((s, i) => {
        const done    = i < step;
        const current = i === step;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                done    ? "bg-blue-600 border-blue-600 text-white"
                : current ? "bg-white border-blue-600 text-blue-600"
                : "bg-white border-slate-300 text-slate-400"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${current ? "text-blue-600" : done ? "text-slate-600" : "text-slate-400"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${i < step ? "bg-blue-500" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Navigation buttons ────────────────────────────────────────────
function StepNav({ step, state, onBack, onNext }: {
  step: number;
  state: WizardState;
  onBack: () => void;
  onNext: () => void;
}) {
  if (step === 4) return null; // Step5 renders its own submit button
  const ok = canProceed(step, state);
  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
      {step > 0 ? (
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          ← Back
        </button>
      ) : <span />}
      <button
        onClick={onNext}
        disabled={!ok}
        className="px-6 py-2.5 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600"
      >
        {step === 3 ? "Review →" : "Next →"}
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function Challenge07() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [claimRef, setClaimRef] = useState("");

  const updateMember = useCallback((patch: Partial<WizardState["member"]>) => {
    setState(s => ({ ...s, member: { ...s.member, ...patch } }));
  }, []);

  const updateTreatment = useCallback((patch: Partial<WizardState["treatment"]>) => {
    setState(s => ({ ...s, treatment: { ...s.treatment, ...patch } }));
  }, []);

  const handleClaimTypeSelect = useCallback((t: ClaimType) => {
    setState(s => ({ ...s, claimType: t, documents: {} }));
    setStep(1);
  }, []);

  const handleFileRemove = useCallback((docName: string) => {
    setState(s => ({ ...s, documents: { ...s.documents, [docName]: null } }));
  }, []);

  const handleFileSelect = useCallback((docName: string, file: File) => {
    // Start upload in state with progress 0
    setState(s => ({
      ...s,
      documents: {
        ...s.documents,
        [docName]: { name: file.name, size: file.size, type: file.type, progress: 0 },
      },
    }));

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress = Math.min(100, progress + Math.floor(Math.random() * 20) + 10);
      setState(s => ({
        ...s,
        documents: {
          ...s.documents,
          [docName]: s.documents[docName]
            ? { ...s.documents[docName]!, progress }
            : null,
        },
      }));
      if (progress >= 100) clearInterval(interval);
    }, 150);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-mono text-slate-400">#07 · Intermediate</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Claims Intake Wizard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit an insurance claim in 5 steps — documents, diagnosis, and review.
        </p>
      </div>

      {/* Wizard card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-2xl">
        {!submitted && <ProgressBar step={step} />}

        {step === 0 && (
          <Step1ClaimType state={state} onSelect={handleClaimTypeSelect} />
        )}
        {step === 1 && (
          <Step2Member state={state} onChange={updateMember} />
        )}
        {step === 2 && (
          <Step3Treatment state={state} onChange={updateTreatment} />
        )}
        {step === 3 && (
          <Step4Documents state={state} onFileSelect={handleFileSelect} onRemove={handleFileRemove} />
        )}
        {step === 4 && (
          <Step5Review
            state={state}
            submitted={submitted}
            onEditStep={(s) => setStep(s)}
            onConfirmChange={(v) => setState(s => ({ ...s, confirmed: v }))}
            claimRef={claimRef}
            onSubmit={() => {
              setClaimRef(`CLM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);
              setSubmitted(true);
            }}
          />
        )}

        {!submitted && (
          <StepNav
            step={step}
            state={state}
            onBack={() => setStep(s => Math.max(0, s - 1))}
            onNext={() => setStep(s => Math.min(4, s + 1))}
          />
        )}
      </div>
    </div>
  );
}
