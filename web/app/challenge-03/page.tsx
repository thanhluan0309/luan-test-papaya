"use client";

import { useState } from "react";
import { events, sampleData, toneButtonColors, type EventId } from "@/lib/challenge-03/data";
import {
  EmailShell,
  SubmittedBody,
  DocumentsBody,
  UnderReviewBody,
  ApprovedBody,
  RejectedBody,
  PaymentSentBody,
} from "./templates";

function interpolateSubject(subject: string, claimNumber: string): string {
  return subject.replace("{claim_number}", claimNumber);
}

function EmailPreview({ eventId }: { eventId: EventId }) {
  const event = events.find((e) => e.id === eventId)!;
  const data = sampleData[eventId];
  const subject = interpolateSubject(event.subject, (data as { claim_number: string }).claim_number);

  const body = (() => {
    switch (eventId) {
      case "submitted":          return <SubmittedBody   data={sampleData.submitted} />;
      case "documents_received": return <DocumentsBody   data={sampleData.documents_received} />;
      case "under_review":       return <UnderReviewBody data={sampleData.under_review} />;
      case "approved":           return <ApprovedBody    data={sampleData.approved} />;
      case "rejected":           return <RejectedBody    data={sampleData.rejected} />;
      case "payment_sent":       return <PaymentSentBody data={sampleData.payment_sent} />;
    }
  })();

  return (
    <div>
      {/* Subject line above frame */}
      <div className="mb-3 px-1">
        <span className="text-xs text-gray-400 uppercase tracking-wide font-medium mr-2">Subject</span>
        <span className="text-sm text-gray-700 font-medium">{subject}</span>
      </div>

      {/* Email frame */}
      <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
        <EmailShell accentColor={event.accentColor} subject={subject}>
          {body}
        </EmailShell>
      </div>
    </div>
  );
}

export default function Challenge03() {
  const [selected, setSelected] = useState<EventId>("submitted");
  const selectedEvent = events.find((e) => e.id === selected)!;
  const colors = toneButtonColors[selectedEvent.tone];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-mono text-gray-400">#03 · Beginner</span>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Claim Notification Email Templates</h1>
        <p className="mt-1 text-sm text-gray-500">
          6 HTML email templates for insurance claim lifecycle events. Select an event to preview.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* ── Event selector ── */}
        <div className="md:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Events</span>
            </div>
            <div className="p-2 flex flex-row md:flex-col gap-1 flex-wrap">
              {events.map((event) => {
                const isActive = selected === event.id;
                const c = toneButtonColors[event.tone];
                return (
                  <button
                    key={event.id}
                    onClick={() => setSelected(event.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? c.active : `text-gray-600 ${c.hover}`
                    }`}
                  >
                    {event.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone badge */}
          <div className="mt-3 px-1">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                selectedEvent.tone === "positive"
                  ? "bg-emerald-100 text-emerald-700"
                  : selectedEvent.tone === "negative"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              Tone: {selectedEvent.tone}
            </span>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="flex-1 min-w-0">
          <EmailPreview key={selected} eventId={selected} />
        </div>
      </div>
    </div>
  );
}
