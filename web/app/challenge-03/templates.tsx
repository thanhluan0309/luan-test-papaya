import type { SampleData } from "@/lib/challenge-03/data";

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const fmt = (n: number) => n.toLocaleString("en-US");

// ── Shared shell ──────────────────────────────────────────────
export function EmailShell({
  accentColor,
  subject,
  children,
}: {
  accentColor: string;
  subject: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: FONT, backgroundColor: "#f3f4f6", padding: "32px 16px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: accentColor,
            borderRadius: "12px 12px 0 0",
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 20, letterSpacing: "-0.3px" }}>
            Papaya Insurance
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
            Claims Portal
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "36px 32px",
            borderLeft: "1px solid #e5e7eb",
            borderRight: "1px solid #e5e7eb",
          }}
        >
          {/* Subject line inside body */}
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 24, lineHeight: 1.3 }}>
            {subject}
          </div>
          {children}
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: "0 0 12px 12px",
            border: "1px solid #e5e7eb",
            borderTop: "none",
            padding: "20px 32px",
            textAlign: "center" as const,
          }}
        >
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Questions? Contact us at{" "}
            <a href="mailto:support@papaya.com" style={{ color: "#2563EB", textDecoration: "none" }}>
              support@papaya.com
            </a>{" "}
            or call{" "}
            <span style={{ color: "#374151" }}>+66 2 000 0000</span>
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
            © 2024 Papaya Insurance. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared elements ───────────────────────────────────────────
function Greeting({ name }: { name: string }) {
  return (
    <p style={{ fontSize: 15, color: "#374151", marginBottom: 16, marginTop: 0 }}>
      Dear <strong>{name}</strong>,
    </p>
  );
}

function InfoBox({
  label,
  value,
  color = "#2563EB",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: color + "0f",
        border: `1px solid ${color}33`,
        borderRadius: 8,
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{value}</span>
    </div>
  );
}

function Divider() {
  return <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />;
}

function Body({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.6, marginTop: 0 }}>{children}</p>;
}

// ── 1. Claim Submitted ────────────────────────────────────────
export function SubmittedBody({ data }: { data: SampleData["submitted"] }) {
  return (
    <>
      <Greeting name={data.member_name} />
      <Body>
        We&apos;ve received your claim and it&apos;s now in our system. Our team will begin reviewing your
        documents shortly. You&apos;ll hear from us within 2–3 business days.
      </Body>
      <Divider />
      <InfoBox label="Claim Number"    value={data.claim_number}  color="#2563EB" />
      <InfoBox label="Claim Type"      value={data.claim_type}    color="#2563EB" />
      <InfoBox label="Date Submitted"  value={data.submitted_date} color="#2563EB" />
      <Divider />
      <Body>You can track your claim status at any time by logging into your member portal.</Body>
    </>
  );
}

// ── 2. Documents Received ─────────────────────────────────────
export function DocumentsBody({ data }: { data: SampleData["documents_received"] }) {
  return (
    <>
      <Greeting name={data.member_name} />
      <Body>
        Great news — we&apos;ve received <strong>{data.document_count} document{data.document_count !== 1 ? "s" : ""}</strong> for
        your claim <strong>{data.claim_number}</strong>. Here&apos;s a summary of what was received:
      </Body>
      <div style={{ margin: "20px 0" }}>
        {data.documents_list.map((doc, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 0",
              borderBottom: i < data.documents_list.length - 1 ? "1px solid #f3f4f6" : "none",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "#d1fae5",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#065f46",
                flexShrink: 0,
              }}
            >
              ✓
            </span>
            <span style={{ fontSize: 14, color: "#374151" }}>{doc}</span>
          </div>
        ))}
      </div>
      <Body>
        Your claim is now moving to the review stage. We&apos;ll notify you once the assessment is complete.
      </Body>
    </>
  );
}

// ── 3. Under Review ───────────────────────────────────────────
export function UnderReviewBody({ data }: { data: SampleData["under_review"] }) {
  return (
    <>
      <Greeting name={data.member_name} />
      <Body>
        Your claim <strong>{data.claim_number}</strong> is currently being reviewed by our assessments team.
        We&apos;re working to process it as quickly as possible.
      </Body>
      <div
        style={{
          backgroundColor: "#fffbeb",
          border: "1px solid #fcd34d",
          borderRadius: 8,
          padding: "16px 20px",
          margin: "20px 0",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e", marginBottom: 4 }}>
          Currently being reviewed by
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#78350f" }}>{data.assessor_name}</div>
        <div style={{ fontSize: 13, color: "#92400e", marginTop: 8 }}>
          Estimated completion: <strong>{data.estimated_days} business day{data.estimated_days !== 1 ? "s" : ""}</strong>
        </div>
      </div>
      <Body>
        We&apos;ll send you an update as soon as the review is complete. No action is required from you at this time.
      </Body>
    </>
  );
}

// ── 4. Approved ───────────────────────────────────────────────
export function ApprovedBody({ data }: { data: SampleData["approved"] }) {
  const coverage = Math.round((data.approved_amount / data.original_amount) * 100);
  return (
    <>
      <Greeting name={data.member_name} />
      <Body>
        We&apos;re pleased to inform you that your claim <strong>{data.claim_number}</strong> has been
        approved. Here are the details of your reimbursement:
      </Body>

      {/* Highlighted amount box */}
      <div
        style={{
          backgroundColor: "#ecfdf5",
          border: "2px solid #10B981",
          borderRadius: 12,
          padding: "24px",
          textAlign: "center" as const,
          margin: "20px 0",
        }}
      >
        <div style={{ fontSize: 13, color: "#065f46", fontWeight: 600, marginBottom: 4 }}>
          Approved Amount
        </div>
        <div style={{ fontSize: 42, fontWeight: 800, color: "#059669", letterSpacing: "-1px" }}>
          ฿{fmt(data.approved_amount)}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
          Original claim: ฿{fmt(data.original_amount)} &nbsp;·&nbsp; Coverage: {coverage}%
        </div>
      </div>

      <InfoBox label="Payment Method" value={data.payment_method} color="#10B981" />
      <Divider />
      <Body>
        Your payment will be processed within 3–5 business days. You&apos;ll receive a separate
        confirmation once the transfer is complete.
      </Body>
    </>
  );
}

// ── 5. Rejected ───────────────────────────────────────────────
export function RejectedBody({ data }: { data: SampleData["rejected"] }) {
  return (
    <>
      <Greeting name={data.member_name} />

      {/* Red banner */}
      <div
        style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderLeft: "4px solid #EF4444",
          borderRadius: "0 8px 8px 0",
          padding: "14px 16px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#991b1b" }}>Claim Not Approved</div>
        <div style={{ fontSize: 13, color: "#b91c1c", marginTop: 2 }}>
          Claim {data.claim_number}
        </div>
      </div>

      <Body>
        After reviewing your submission, we were unable to approve this claim. We understand this may be
        disappointing, and we want to make sure you have all the information you need.
      </Body>

      {/* Reason box */}
      <div
        style={{
          backgroundColor: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: 8,
          padding: "16px 20px",
          margin: "20px 0",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#9a3412", marginBottom: 6 }}>
          Reason for Rejection
        </div>
        <div style={{ fontSize: 14, color: "#7c2d12", lineHeight: 1.5 }}>{data.rejection_reason}</div>
      </div>

      <Divider />

      {/* Next steps */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
          What you can do next
        </div>
        {[
          "Review your policy terms to understand the applicable exclusion",
          `Submit a formal appeal by ${data.appeal_deadline} if you believe this decision is incorrect`,
          "Contact our support team if you need clarification or assistance",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <span
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                fontSize: 12,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </span>
            <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>

      <InfoBox label="Appeal Deadline" value={data.appeal_deadline} color="#EF4444" />
    </>
  );
}

// ── 6. Payment Sent ───────────────────────────────────────────
export function PaymentSentBody({ data }: { data: SampleData["payment_sent"] }) {
  return (
    <>
      <Greeting name={data.member_name} />

      {/* Success icon + amount */}
      <div style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <div
          style={{
            display: "inline-flex",
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#d1fae5",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 16,
          }}
        >
          ✓
        </div>
        <div style={{ fontSize: 13, color: "#065f46", fontWeight: 600, marginBottom: 4 }}>
          Payment Transferred
        </div>
        <div style={{ fontSize: 38, fontWeight: 800, color: "#059669", letterSpacing: "-1px" }}>
          ฿{fmt(data.payment_amount)}
        </div>
      </div>

      <Divider />
      <InfoBox label="Payment Date"     value={data.payment_date}     color="#10B981" />
      <InfoBox label="Reference Number" value={data.reference_number} color="#10B981" />
      <InfoBox label="Claim Number"     value={data.claim_number}     color="#10B981" />
      <Divider />

      <Body>
        The funds have been sent to your registered account and should arrive within 1–2 business days,
        depending on your bank. Please keep the reference number above for your records.
      </Body>
    </>
  );
}
