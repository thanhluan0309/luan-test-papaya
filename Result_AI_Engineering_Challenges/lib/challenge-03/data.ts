export type EventId =
  | "submitted"
  | "documents_received"
  | "under_review"
  | "approved"
  | "rejected"
  | "payment_sent";

export interface EmailEvent {
  id: EventId;
  label: string;
  subject: string;
  tone: "neutral" | "positive" | "negative";
  accentColor: string;
}

export const events: EmailEvent[] = [
  {
    id: "submitted",
    label: "Claim Submitted",
    subject: "Your claim {claim_number} has been received",
    tone: "neutral",
    accentColor: "#2563EB",
  },
  {
    id: "documents_received",
    label: "Documents Received",
    subject: "Documents received for claim {claim_number}",
    tone: "neutral",
    accentColor: "#2563EB",
  },
  {
    id: "under_review",
    label: "Under Review",
    subject: "Your claim {claim_number} is being reviewed",
    tone: "neutral",
    accentColor: "#F59E0B",
  },
  {
    id: "approved",
    label: "Approved",
    subject: "Good news! Claim {claim_number} has been approved",
    tone: "positive",
    accentColor: "#10B981",
  },
  {
    id: "rejected",
    label: "Rejected",
    subject: "Update on claim {claim_number}",
    tone: "negative",
    accentColor: "#EF4444",
  },
  {
    id: "payment_sent",
    label: "Payment Sent",
    subject: "Payment for claim {claim_number} has been processed",
    tone: "positive",
    accentColor: "#10B981",
  },
];

export const sampleData = {
  submitted: {
    claim_number: "CLM-2024-001234",
    member_name: "Sarah Johnson",
    claim_type: "Outpatient",
    submitted_date: "March 15, 2024",
  },
  documents_received: {
    claim_number: "CLM-2024-001234",
    member_name: "Sarah Johnson",
    document_count: 3,
    documents_list: ["Medical Receipt", "Doctor's Note", "Lab Results"],
  },
  under_review: {
    claim_number: "CLM-2024-001234",
    member_name: "Sarah Johnson",
    assessor_name: "Dr. Michael Chen",
    estimated_days: 3,
  },
  approved: {
    claim_number: "CLM-2024-001234",
    member_name: "Sarah Johnson",
    approved_amount: 12500,
    original_amount: 15000,
    payment_method: "Bank Transfer",
  },
  rejected: {
    claim_number: "CLM-2024-001234",
    member_name: "Sarah Johnson",
    rejection_reason:
      "The submitted treatment falls under cosmetic procedure exclusions outlined in your policy (Section 4.2).",
    appeal_deadline: "April 15, 2024",
  },
  payment_sent: {
    claim_number: "CLM-2024-001234",
    member_name: "Sarah Johnson",
    payment_amount: 12500,
    payment_date: "March 22, 2024",
    reference_number: "PAY-2024-789012",
  },
};

export type SampleData = typeof sampleData;

export const toneButtonColors: Record<EmailEvent["tone"], { active: string; hover: string }> = {
  neutral:  { active: "bg-blue-600 text-white",   hover: "hover:bg-blue-50 hover:text-blue-700" },
  positive: { active: "bg-emerald-600 text-white", hover: "hover:bg-emerald-50 hover:text-emerald-700" },
  negative: { active: "bg-red-600 text-white",     hover: "hover:bg-red-50 hover:text-red-700" },
};
