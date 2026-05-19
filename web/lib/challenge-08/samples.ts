import type { SampleDoc } from "./types";

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111;font-size:13px;line-height:1.5;padding:28px}
.org{font-size:18px;font-weight:700;color:#1d3557}
.org-sub{font-size:11px;color:#666;margin-top:2px}
.doc-title{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#1d3557;border:2px solid #1d3557;display:inline-block;padding:3px 12px;margin-top:8px}
.hdr{border-bottom:3px solid #1d3557;padding-bottom:14px;margin-bottom:18px}
.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
.meta2{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:18px}
.lbl{font-size:10px;text-transform:uppercase;color:#888;font-weight:600;letter-spacing:.04em}
.val{font-size:13px;font-weight:600;color:#111;margin-top:2px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
thead th{background:#1d3557;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:600}
td{padding:7px 10px;border-bottom:1px solid #e9ecef;font-size:12px}
tr:nth-child(even) td{background:#f8fafc}
.total td{background:#eef2ff;font-weight:700;font-size:13px;border-top:2px solid #1d3557}
.foot{margin-top:20px;padding-top:12px;border-top:1px solid #dee2e6;font-size:11px;color:#888;text-align:center}
.sec{font-size:12px;font-weight:700;text-transform:uppercase;color:#1d3557;border-bottom:1px solid #1d3557;padding-bottom:4px;margin:16px 0 10px}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;text-transform:uppercase}
.hi{background:#fee2e2;color:#dc2626}.lo{background:#dbeafe;color:#2563eb}.nm{background:#dcfce7;color:#16a34a}
ul{padding-left:18px;font-size:12px}li{margin-bottom:4px}
.kv{display:grid;grid-template-columns:160px 1fr;gap:8px 16px;margin-bottom:4px}
.kv .k{font-size:11px;color:#666;font-weight:600;text-transform:uppercase}
.kv .v{font-size:13px;color:#111}
`;

function doc(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS}</style></head><body>${body}</body></html>`;
}

export const samples: SampleDoc[] = [
  // ── Receipt 1 ─────────────────────────────────────────────────
  {
    id: "sample-01",
    label: "Bangkok Hospital Receipt",
    type: "receipt",
    html: doc(`
<div class="hdr">
  <div class="org">Bangkok Hospital</div>
  <div class="org-sub">2 Soi Soonvijai 7, New Petchburi Rd, Bangkok 10310 · Tel: +66 2 310 3000</div>
  <div class="doc-title">Official Receipt</div>
</div>
<div class="meta">
  <div><div class="lbl">Receipt No.</div><div class="val">BH-2024-031547</div></div>
  <div><div class="lbl">Patient Name</div><div class="val">Sarah Johnson</div></div>
  <div><div class="lbl">Date</div><div class="val">15 March 2024</div></div>
  <div><div class="lbl">Payment Method</div><div class="val">Credit Card</div></div>
</div>
<table>
  <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price (฿)</th><th style="text-align:right">Total (฿)</th></tr></thead>
  <tbody>
    <tr><td>Doctor Consultation (Internal Medicine)</td><td style="text-align:center">1</td><td style="text-align:right">1,500.00</td><td style="text-align:right">1,500.00</td></tr>
    <tr><td>Laboratory Tests (CBC, LFT, Lipid Panel)</td><td style="text-align:center">1</td><td style="text-align:right">3,200.00</td><td style="text-align:right">3,200.00</td></tr>
    <tr><td>Prescribed Medications (7-day antibiotic course)</td><td style="text-align:center">1</td><td style="text-align:right">850.00</td><td style="text-align:right">850.00</td></tr>
    <tr class="total"><td colspan="3" style="text-align:right;font-weight:700">GRAND TOTAL</td><td style="text-align:right">5,550.00</td></tr>
  </tbody>
</table>
<div class="foot">This is an official receipt. For insurance claims, please attach this document.<br>Issued by: Bangkok Hospital Finance Department</div>
`),
    precomputed: {
      document_type: "receipt",
      confidence: 0.97,
      fields: {
        hospital_name:  { value: "Bangkok Hospital", confidence: 0.99 },
        patient_name:   { value: "Sarah Johnson", confidence: 0.98 },
        date:           { value: "2024-03-15", confidence: 0.96 },
        payment_method: { value: "Credit Card", confidence: 0.99 },
        items: {
          value: [
            { description: "Doctor Consultation (Internal Medicine)", quantity: 1, unit_price: 1500, total: 1500 },
            { description: "Laboratory Tests (CBC, LFT, Lipid Panel)", quantity: 1, unit_price: 3200, total: 3200 },
            { description: "Prescribed Medications (7-day antibiotic course)", quantity: 1, unit_price: 850, total: 850 },
          ],
          confidence: 0.97,
        },
        grand_total: { value: 5550, confidence: 0.99 },
      },
      validation_errors: [],
    },
  },

  // ── Receipt 2 ─────────────────────────────────────────────────
  {
    id: "sample-02",
    label: "Bumrungrad International Receipt",
    type: "receipt",
    html: doc(`
<div class="hdr">
  <div class="org">Bumrungrad International Hospital</div>
  <div class="org-sub">33 Sukhumvit Soi 3, Wattana, Bangkok 10110 · Tel: +66 2 066 8888</div>
  <div class="doc-title">Patient Invoice</div>
</div>
<div class="meta">
  <div><div class="lbl">Invoice No.</div><div class="val">BIH-INV-240622</div></div>
  <div><div class="lbl">Patient</div><div class="val">Michael Chen</div></div>
  <div><div class="lbl">Date of Service</div><div class="val">22 June 2024</div></div>
  <div><div class="lbl">Payment</div><div class="val">Insurance Direct Billing</div></div>
</div>
<table>
  <thead><tr><th>Service Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price (฿)</th><th style="text-align:right">Amount (฿)</th></tr></thead>
  <tbody>
    <tr><td>Emergency Department Consultation</td><td style="text-align:center">1</td><td style="text-align:right">2,000.00</td><td style="text-align:right">2,000.00</td></tr>
    <tr><td>CT Scan — Abdomen &amp; Pelvis with Contrast</td><td style="text-align:center">1</td><td style="text-align:right">8,500.00</td><td style="text-align:right">8,500.00</td></tr>
    <tr><td>Nursing Care &amp; Observation (4 hours)</td><td style="text-align:center">1</td><td style="text-align:right">1,200.00</td><td style="text-align:right">1,200.00</td></tr>
    <tr><td>Intravenous Medications &amp; Supplies</td><td style="text-align:center">1</td><td style="text-align:right">3,350.00</td><td style="text-align:right">3,350.00</td></tr>
    <tr class="total"><td colspan="3" style="text-align:right;font-weight:700">TOTAL AMOUNT</td><td style="text-align:right">15,050.00</td></tr>
  </tbody>
</table>
<div class="foot">Guaranteed by: AXA Insurance · Guarantee No. AXA-2024-88731<br>Patient signature required for final settlement.</div>
`),
    precomputed: {
      document_type: "receipt",
      confidence: 0.96,
      fields: {
        hospital_name:  { value: "Bumrungrad International Hospital", confidence: 0.99 },
        patient_name:   { value: "Michael Chen", confidence: 0.98 },
        date:           { value: "2024-06-22", confidence: 0.95 },
        payment_method: { value: "Insurance Direct Billing", confidence: 0.97 },
        items: {
          value: [
            { description: "Emergency Department Consultation", quantity: 1, unit_price: 2000, total: 2000 },
            { description: "CT Scan — Abdomen & Pelvis with Contrast", quantity: 1, unit_price: 8500, total: 8500 },
            { description: "Nursing Care & Observation (4 hours)", quantity: 1, unit_price: 1200, total: 1200 },
            { description: "Intravenous Medications & Supplies", quantity: 1, unit_price: 3350, total: 3350 },
          ],
          confidence: 0.96,
        },
        grand_total: { value: 15050, confidence: 0.99 },
      },
      validation_errors: [],
    },
  },

  // ── Receipt 3 (intentional item mismatch for validation demo) ──
  {
    id: "sample-03",
    label: "Samitivej Receipt (Validation Demo)",
    type: "receipt",
    html: doc(`
<div class="hdr">
  <div class="org">Samitivej Sukhumvit Hospital</div>
  <div class="org-sub">133 Sukhumvit Soi 49, Wattana, Bangkok 10110 · Tel: +66 2 711 8000</div>
  <div class="doc-title">Medical Receipt</div>
</div>
<div class="meta">
  <div><div class="lbl">Receipt No.</div><div class="val">SMJ-2024-19034</div></div>
  <div><div class="lbl">Patient</div><div class="val">Emma Wilson</div></div>
  <div><div class="lbl">Date</div><div class="val">10 September 2024</div></div>
  <div><div class="lbl">Payment</div><div class="val">Cash</div></div>
</div>
<table>
  <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price (฿)</th><th style="text-align:right">Total (฿)</th></tr></thead>
  <tbody>
    <tr><td>OPD Consultation (General Practice)</td><td style="text-align:center">1</td><td style="text-align:right">800.00</td><td style="text-align:right">800.00</td></tr>
    <tr><td>Dental Scaling &amp; Cleaning</td><td style="text-align:center">1</td><td style="text-align:right">1,200.00</td><td style="text-align:right">1,200.00</td></tr>
    <tr><td>Dental Periapical X-ray (2 films)</td><td style="text-align:center">2</td><td style="text-align:right">300.00</td><td style="text-align:right">600.00</td></tr>
    <tr class="total"><td colspan="3" style="text-align:right;font-weight:700">GRAND TOTAL (incl. 7% VAT)</td><td style="text-align:right">2,780.00</td></tr>
  </tbody>
</table>
<div class="foot">VAT Registration No. 0105555082523 · Keep this receipt for tax purposes.</div>
`),
    precomputed: {
      document_type: "receipt",
      confidence: 0.95,
      fields: {
        hospital_name:  { value: "Samitivej Sukhumvit Hospital", confidence: 0.99 },
        patient_name:   { value: "Emma Wilson", confidence: 0.98 },
        date:           { value: "2024-09-10", confidence: 0.96 },
        payment_method: { value: "Cash", confidence: 0.99 },
        items: {
          value: [
            { description: "OPD Consultation (General Practice)", quantity: 1, unit_price: 800, total: 800 },
            { description: "Dental Scaling & Cleaning", quantity: 1, unit_price: 1200, total: 1200 },
            { description: "Dental Periapical X-ray (2 films)", quantity: 2, unit_price: 300, total: 600 },
          ],
          confidence: 0.96,
        },
        grand_total: { value: 2780, confidence: 0.98 },
      },
      validation_errors: [
        "Items sum (฿2,600) differs from grand_total (฿2,780) by 6.5% — likely includes VAT not itemised",
      ],
    },
  },

  // ── Discharge Summary 1 ───────────────────────────────────────
  {
    id: "sample-04",
    label: "Discharge Summary — Pneumonia",
    type: "discharge_summary",
    html: doc(`
<div class="hdr">
  <div class="org">Ramathibodi Hospital</div>
  <div class="org-sub">270 Rama VI Road, Ratchathewi, Bangkok 10400 · Tel: +66 2 201 1000</div>
  <div class="doc-title">Discharge Summary</div>
</div>
<div class="meta2">
  <div><div class="lbl">Patient Name</div><div class="val">David Nguyen</div></div>
  <div><div class="lbl">HN / Patient ID</div><div class="val">RAM-2024-047821</div></div>
  <div><div class="lbl">Date of Admission</div><div class="val">10 April 2024</div></div>
  <div><div class="lbl">Date of Discharge</div><div class="val">17 April 2024</div></div>
  <div><div class="lbl">Attending Physician</div><div class="val">Dr. Somchai Rattana, M.D.</div></div>
  <div><div class="lbl">Ward / Bed</div><div class="val">Respiratory Ward / B-204</div></div>
</div>
<div class="sec">Diagnosis</div>
<div class="kv"><span class="k">Primary:</span><span class="v">Community-acquired pneumonia (J18.9)</span></div>
<div class="kv"><span class="k">Secondary:</span><span class="v">Mild dehydration; Elevated inflammatory markers</span></div>
<div class="sec">Procedures Performed</div>
<ul>
  <li>IV antibiotics (Ceftriaxone 2g OD × 7 days, Azithromycin 500mg OD × 5 days)</li>
  <li>Intravenous fluid resuscitation (Normal saline 1L × 3)</li>
  <li>Chest physiotherapy (twice daily)</li>
  <li>Pulse oximetry monitoring</li>
  <li>Chest X-ray on admission and day 5</li>
</ul>
<div class="sec">Discharge Instructions</div>
<ul>
  <li>Complete oral antibiotic course: Amoxicillin-clavulanate 625mg TID × 7 days</li>
  <li>Rest and maintain adequate hydration</li>
  <li>Avoid smoking and dusty environments</li>
  <li>Follow-up outpatient appointment in <strong>1 week</strong> (Pulmonology Clinic)</li>
  <li>Return to ED immediately if fever &gt;38.5°C or breathing difficulty worsens</li>
</ul>
<div class="foot">Document prepared by: Dr. Somchai Rattana · Reviewed: Ramathibodi Medical Records Dept.</div>
`),
    precomputed: {
      document_type: "discharge_summary",
      confidence: 0.96,
      fields: {
        hospital_name:          { value: "Ramathibodi Hospital", confidence: 0.99 },
        patient_name:           { value: "David Nguyen", confidence: 0.98 },
        admission_date:         { value: "2024-04-10", confidence: 0.97 },
        discharge_date:         { value: "2024-04-17", confidence: 0.97 },
        attending_physician:    { value: "Dr. Somchai Rattana, M.D.", confidence: 0.99 },
        diagnosis: {
          value: {
            primary: "Community-acquired pneumonia (J18.9)",
            secondary: "Mild dehydration; Elevated inflammatory markers",
          },
          confidence: 0.98,
        },
        procedures_performed: {
          value: [
            "IV antibiotics (Ceftriaxone 2g OD × 7 days, Azithromycin 500mg OD × 5 days)",
            "Intravenous fluid resuscitation (Normal saline 1L × 3)",
            "Chest physiotherapy (twice daily)",
            "Pulse oximetry monitoring",
            "Chest X-ray on admission and day 5",
          ],
          confidence: 0.95,
        },
        discharge_instructions: {
          value: "Complete oral antibiotic course; Rest; Follow-up in 1 week at Pulmonology Clinic; Return if fever >38.5°C or dyspnoea worsens",
          confidence: 0.93,
        },
      },
      validation_errors: [],
    },
  },

  // ── Discharge Summary 2 ───────────────────────────────────────
  {
    id: "sample-05",
    label: "Discharge Summary — Appendectomy",
    type: "discharge_summary",
    html: doc(`
<div class="hdr">
  <div class="org">Bangkok Hospital</div>
  <div class="org-sub">2 Soi Soonvijai 7, New Petchburi Rd, Bangkok 10310</div>
  <div class="doc-title">Surgical Discharge Summary</div>
</div>
<div class="meta2">
  <div><div class="lbl">Patient Name</div><div class="val">Priya Sharma</div></div>
  <div><div class="lbl">HN</div><div class="val">BKH-2024-019456</div></div>
  <div><div class="lbl">Admission Date</div><div class="val">05 July 2024</div></div>
  <div><div class="lbl">Discharge Date</div><div class="val">08 July 2024</div></div>
  <div><div class="lbl">Surgeon</div><div class="val">Dr. Wanlop Charoenwong, FACS</div></div>
  <div><div class="lbl">Anaesthesiologist</div><div class="val">Dr. Anchisa Phong, M.D.</div></div>
</div>
<div class="sec">Diagnosis</div>
<div class="kv"><span class="k">Primary:</span><span class="v">Acute appendicitis (K35.80)</span></div>
<div class="kv"><span class="k">Secondary:</span><span class="v">None</span></div>
<div class="sec">Procedures Performed</div>
<ul>
  <li>Laparoscopic appendectomy (04:15 PM, 05 July 2024) — uneventful</li>
  <li>General anaesthesia (endotracheal intubation)</li>
  <li>IV antibiotics (Metronidazole 500mg + Cefazolin 1g peri-operative)</li>
  <li>Wound closure with absorbable sutures</li>
</ul>
<div class="sec">Discharge Instructions</div>
<ul>
  <li>Oral antibiotics: Cephalexin 500mg QID × 7 days + Metronidazole 400mg TID × 5 days</li>
  <li>Pain management: Ibuprofen 400mg PRN (max 3×/day), Paracetamol 500mg PRN</li>
  <li>Keep wound dry for 48 hours; change dressing every 2 days</li>
  <li>No heavy lifting for 2 weeks; light activity only</li>
  <li>Post-operative follow-up: 14 July 2024 (Surgical Outpatient Clinic)</li>
</ul>
<div class="foot">Certified correct: Dr. Wanlop Charoenwong · Bangkok Hospital Surgical Unit</div>
`),
    precomputed: {
      document_type: "discharge_summary",
      confidence: 0.97,
      fields: {
        hospital_name:       { value: "Bangkok Hospital", confidence: 0.99 },
        patient_name:        { value: "Priya Sharma", confidence: 0.98 },
        admission_date:      { value: "2024-07-05", confidence: 0.97 },
        discharge_date:      { value: "2024-07-08", confidence: 0.97 },
        attending_physician: { value: "Dr. Wanlop Charoenwong, FACS", confidence: 0.98 },
        diagnosis: {
          value: { primary: "Acute appendicitis (K35.80)", secondary: "None" },
          confidence: 0.98,
        },
        procedures_performed: {
          value: [
            "Laparoscopic appendectomy",
            "General anaesthesia (endotracheal intubation)",
            "IV antibiotics (Metronidazole + Cefazolin peri-operative)",
            "Wound closure with absorbable sutures",
          ],
          confidence: 0.96,
        },
        discharge_instructions: {
          value: "Cephalexin 500mg QID × 7d + Metronidazole 400mg TID × 5d; wound care; no heavy lifting 2 weeks; follow-up 14 July 2024",
          confidence: 0.94,
        },
      },
      validation_errors: [],
    },
  },

  // ── Discharge Summary 3 ───────────────────────────────────────
  {
    id: "sample-06",
    label: "Discharge Summary — Maternity",
    type: "discharge_summary",
    html: doc(`
<div class="hdr">
  <div class="org">Samitivej Sukhumvit Hospital</div>
  <div class="org-sub">Women &amp; Children's Medical Centre · 133 Sukhumvit Soi 49, Bangkok</div>
  <div class="doc-title">Maternity Discharge Summary</div>
</div>
<div class="meta2">
  <div><div class="lbl">Patient (Mother)</div><div class="val">Nattaya Boonmee</div></div>
  <div><div class="lbl">HN</div><div class="val">SMJ-MAT-2024-00834</div></div>
  <div><div class="lbl">Admission Date</div><div class="val">20 November 2024</div></div>
  <div><div class="lbl">Discharge Date</div><div class="val">22 November 2024</div></div>
  <div><div class="lbl">Obstetrician</div><div class="val">Dr. Anchisa Phong, M.D., OB-GYN</div></div>
  <div><div class="lbl">Paediatrician</div><div class="val">Dr. Sompong Prasert, M.D.</div></div>
</div>
<div class="sec">Diagnosis</div>
<div class="kv"><span class="k">Primary:</span><span class="v">Normal term delivery, gravida 2 para 2 (O80)</span></div>
<div class="kv"><span class="k">Secondary:</span><span class="v">Mild perineal laceration (1st degree) — repaired</span></div>
<div class="sec">Procedures Performed</div>
<ul>
  <li>Spontaneous vaginal delivery at 38+5 weeks gestation (09:42 AM, 20 November 2024)</li>
  <li>Epidural anaesthesia administered by Dr. Anchisa Phong</li>
  <li>Perineal repair (1st degree tear, 2-0 Vicryl suture)</li>
  <li>Newborn APGAR score: 9 at 1 min, 10 at 5 min — healthy female infant, 3.2 kg</li>
</ul>
<div class="sec">Discharge Instructions</div>
<ul>
  <li>Ferrous sulphate 200mg BD × 6 weeks (iron supplementation)</li>
  <li>Pelvic floor exercises from day 2 post-delivery</li>
  <li>Breastfeeding support available — Lactation Clinic ext. 3201</li>
  <li>Postnatal check-up: 6 December 2024 (OB-GYN Outpatient Clinic)</li>
  <li>Newborn follow-up: 27 November 2024 (Paediatric Clinic)</li>
</ul>
<div class="foot">This document is confidential medical information. Samitivej Sukhumvit Hospital Medical Records.</div>
`),
    precomputed: {
      document_type: "discharge_summary",
      confidence: 0.96,
      fields: {
        hospital_name:       { value: "Samitivej Sukhumvit Hospital", confidence: 0.99 },
        patient_name:        { value: "Nattaya Boonmee", confidence: 0.98 },
        admission_date:      { value: "2024-11-20", confidence: 0.97 },
        discharge_date:      { value: "2024-11-22", confidence: 0.97 },
        attending_physician: { value: "Dr. Anchisa Phong, M.D., OB-GYN", confidence: 0.98 },
        diagnosis: {
          value: {
            primary: "Normal term delivery, gravida 2 para 2 (O80)",
            secondary: "Mild perineal laceration (1st degree) — repaired",
          },
          confidence: 0.97,
        },
        procedures_performed: {
          value: [
            "Spontaneous vaginal delivery at 38+5 weeks",
            "Epidural anaesthesia",
            "Perineal repair (1st degree tear)",
            "Newborn APGAR assessment",
          ],
          confidence: 0.95,
        },
        discharge_instructions: {
          value: "Ferrous sulphate 200mg BD × 6 weeks; pelvic floor exercises; postnatal check-up 6 Dec 2024; newborn follow-up 27 Nov 2024",
          confidence: 0.93,
        },
      },
      validation_errors: [],
    },
  },

  // ── Lab Report 1 ─────────────────────────────────────────────
  {
    id: "sample-07",
    label: "CBC Lab Report",
    type: "lab_report",
    html: doc(`
<div class="hdr">
  <div class="org">Bangkok Hospital Clinical Laboratory</div>
  <div class="org-sub">ISO 15189:2012 Accredited · Lab Director: Dr. Surachai Phong, Ph.D.</div>
  <div class="doc-title">Complete Blood Count (CBC)</div>
</div>
<div class="meta">
  <div><div class="lbl">Patient</div><div class="val">Robert Williams</div></div>
  <div><div class="lbl">Sample Date</div><div class="val">28 February 2024</div></div>
  <div><div class="lbl">Specimen</div><div class="val">Whole Blood (EDTA)</div></div>
  <div><div class="lbl">Lab Ref.</div><div class="val">BHL-CBC-240228-0091</div></div>
</div>
<table>
  <thead><tr><th>Test Name</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Flag</th></tr></thead>
  <tbody>
    <tr><td>White Blood Cells (WBC)</td><td><strong>11.5</strong></td><td>K/μL</td><td>4.5 – 11.0</td><td><span class="badge hi">HIGH</span></td></tr>
    <tr><td>Red Blood Cells (RBC)</td><td>4.8</td><td>M/μL</td><td>4.2 – 5.8</td><td><span class="badge nm">NORMAL</span></td></tr>
    <tr><td>Hemoglobin (HGB)</td><td>14.2</td><td>g/dL</td><td>12.0 – 17.5</td><td><span class="badge nm">NORMAL</span></td></tr>
    <tr><td>Hematocrit (HCT)</td><td>42</td><td>%</td><td>36 – 52</td><td><span class="badge nm">NORMAL</span></td></tr>
    <tr><td>Mean Corpuscular Volume (MCV)</td><td>88</td><td>fL</td><td>80 – 100</td><td><span class="badge nm">NORMAL</span></td></tr>
    <tr><td>Platelets (PLT)</td><td>350</td><td>K/μL</td><td>150 – 400</td><td><span class="badge nm">NORMAL</span></td></tr>
    <tr><td>Neutrophils</td><td><strong>78</strong></td><td>%</td><td>40 – 75</td><td><span class="badge hi">HIGH</span></td></tr>
    <tr><td>Lymphocytes</td><td><strong>16</strong></td><td>%</td><td>20 – 45</td><td><span class="badge lo">LOW</span></td></tr>
  </tbody>
</table>
<div class="foot">Results verified by: Dr. Surachai Phong · Bangkok Hospital Lab · Authorised Report</div>
`),
    precomputed: {
      document_type: "lab_report",
      confidence: 0.97,
      fields: {
        lab_name:     { value: "Bangkok Hospital Clinical Laboratory", confidence: 0.99 },
        patient_name: { value: "Robert Williams", confidence: 0.98 },
        date:         { value: "2024-02-28", confidence: 0.97 },
        tests: {
          value: [
            { test_name: "White Blood Cells (WBC)", result: "11.5", unit: "K/μL", reference_range: "4.5 – 11.0", flag: "high" },
            { test_name: "Red Blood Cells (RBC)",   result: "4.8",  unit: "M/μL", reference_range: "4.2 – 5.8",  flag: "normal" },
            { test_name: "Hemoglobin (HGB)",         result: "14.2", unit: "g/dL", reference_range: "12.0 – 17.5",flag: "normal" },
            { test_name: "Hematocrit (HCT)",         result: "42",   unit: "%",    reference_range: "36 – 52",    flag: "normal" },
            { test_name: "Mean Corpuscular Volume",  result: "88",   unit: "fL",   reference_range: "80 – 100",   flag: "normal" },
            { test_name: "Platelets (PLT)",          result: "350",  unit: "K/μL", reference_range: "150 – 400",  flag: "normal" },
            { test_name: "Neutrophils",              result: "78",   unit: "%",    reference_range: "40 – 75",    flag: "high" },
            { test_name: "Lymphocytes",              result: "16",   unit: "%",    reference_range: "20 – 45",    flag: "low" },
          ],
          confidence: 0.97,
        },
      },
      validation_errors: [],
    },
  },

  // ── Lab Report 2 ─────────────────────────────────────────────
  {
    id: "sample-08",
    label: "Metabolic Panel Report",
    type: "lab_report",
    html: doc(`
<div class="hdr">
  <div class="org">MedPark Hospital Laboratory</div>
  <div class="org-sub">57 Rama IV Road, Klong Toei, Bangkok 10110 · Tel: +66 2 090 3900</div>
  <div class="doc-title">Comprehensive Metabolic Panel</div>
</div>
<div class="meta">
  <div><div class="lbl">Patient</div><div class="val">Kanokwan Srisuk</div></div>
  <div><div class="lbl">Date Collected</div><div class="val">14 August 2024</div></div>
  <div><div class="lbl">Fasting</div><div class="val">Yes (10 hours)</div></div>
  <div><div class="lbl">Order No.</div><div class="val">MPH-LAB-0814-3321</div></div>
</div>
<table>
  <thead><tr><th>Test Name</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Flag</th></tr></thead>
  <tbody>
    <tr><td>Fasting Plasma Glucose</td><td><strong>126</strong></td><td>mg/dL</td><td>70 – 99</td><td><span class="badge hi">HIGH</span></td></tr>
    <tr><td>HbA1c (Glycated Haemoglobin)</td><td><strong>7.2</strong></td><td>%</td><td>&lt; 5.7</td><td><span class="badge hi">HIGH</span></td></tr>
    <tr><td>Total Cholesterol</td><td><strong>220</strong></td><td>mg/dL</td><td>&lt; 200</td><td><span class="badge hi">HIGH</span></td></tr>
    <tr><td>LDL Cholesterol</td><td><strong>145</strong></td><td>mg/dL</td><td>&lt; 100</td><td><span class="badge hi">HIGH</span></td></tr>
    <tr><td>HDL Cholesterol</td><td><strong>38</strong></td><td>mg/dL</td><td>&gt; 40 (F)</td><td><span class="badge lo">LOW</span></td></tr>
    <tr><td>Triglycerides</td><td><strong>180</strong></td><td>mg/dL</td><td>&lt; 150</td><td><span class="badge hi">HIGH</span></td></tr>
    <tr><td>Serum Creatinine</td><td>0.9</td><td>mg/dL</td><td>0.5 – 1.1 (F)</td><td><span class="badge nm">NORMAL</span></td></tr>
    <tr><td>eGFR</td><td>82</td><td>mL/min/1.73m²</td><td>&gt; 60</td><td><span class="badge nm">NORMAL</span></td></tr>
    <tr><td>ALT (SGPT)</td><td>28</td><td>U/L</td><td>7 – 56</td><td><span class="badge nm">NORMAL</span></td></tr>
    <tr><td>AST (SGOT)</td><td>24</td><td>U/L</td><td>10 – 40</td><td><span class="badge nm">NORMAL</span></td></tr>
  </tbody>
</table>
<div style="background:#fff3cd;border:1px solid #ffc107;padding:10px 14px;border-radius:4px;font-size:12px;margin-bottom:16px">
  ⚠ <strong>Clinical Note:</strong> Glucose and lipid results are consistent with Type 2 Diabetes Mellitus and Dyslipidaemia. Recommend physician review and initiation of appropriate therapy.
</div>
<div class="foot">Validated by: MedPark Hospital Laboratory · Report Date: 14 August 2024</div>
`),
    precomputed: {
      document_type: "lab_report",
      confidence: 0.97,
      fields: {
        lab_name:     { value: "MedPark Hospital Laboratory", confidence: 0.99 },
        patient_name: { value: "Kanokwan Srisuk", confidence: 0.98 },
        date:         { value: "2024-08-14", confidence: 0.97 },
        tests: {
          value: [
            { test_name: "Fasting Plasma Glucose",    result: "126", unit: "mg/dL",          reference_range: "70 – 99",       flag: "high" },
            { test_name: "HbA1c",                     result: "7.2", unit: "%",              reference_range: "< 5.7",         flag: "high" },
            { test_name: "Total Cholesterol",         result: "220", unit: "mg/dL",          reference_range: "< 200",         flag: "high" },
            { test_name: "LDL Cholesterol",           result: "145", unit: "mg/dL",          reference_range: "< 100",         flag: "high" },
            { test_name: "HDL Cholesterol",           result: "38",  unit: "mg/dL",          reference_range: "> 40 (F)",      flag: "low" },
            { test_name: "Triglycerides",             result: "180", unit: "mg/dL",          reference_range: "< 150",         flag: "high" },
            { test_name: "Serum Creatinine",          result: "0.9", unit: "mg/dL",          reference_range: "0.5 – 1.1 (F)", flag: "normal" },
            { test_name: "eGFR",                      result: "82",  unit: "mL/min/1.73m²",  reference_range: "> 60",          flag: "normal" },
            { test_name: "ALT (SGPT)",                result: "28",  unit: "U/L",            reference_range: "7 – 56",        flag: "normal" },
            { test_name: "AST (SGOT)",                result: "24",  unit: "U/L",            reference_range: "10 – 40",       flag: "normal" },
          ],
          confidence: 0.97,
        },
      },
      validation_errors: [],
    },
  },

  // ── Prescription 1 ────────────────────────────────────────────
  {
    id: "sample-09",
    label: "Outpatient Prescription",
    type: "prescription",
    html: doc(`
<div class="hdr">
  <div class="org">City Medical Clinic</div>
  <div class="org-sub">123/45 Sukhumvit Road, Klongtoey, Bangkok 10110 · Medical Licence No. 10B-567890</div>
  <div class="doc-title">Medical Prescription</div>
</div>
<div class="meta">
  <div><div class="lbl">Rx No.</div><div class="val">CMC-RX-240512-088</div></div>
  <div><div class="lbl">Patient Name</div><div class="val">John Smith</div></div>
  <div><div class="lbl">Date</div><div class="val">12 May 2024</div></div>
  <div><div class="lbl">Prescribing Doctor</div><div class="val">Dr. Somchai Rattana, M.D.</div></div>
</div>
<div class="sec">Medications</div>
<table>
  <thead><tr><th>#</th><th>Medication &amp; Strength</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Qty</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Amoxicillin 500mg capsules</td><td>500mg</td><td>3 times daily (with meals)</td><td>7 days</td><td>21 caps</td></tr>
    <tr><td>2</td><td>Paracetamol 500mg tablets</td><td>500–1000mg</td><td>Every 4–6 hours as needed</td><td>5 days</td><td>20 tabs</td></tr>
    <tr><td>3</td><td>Cetirizine 10mg tablets</td><td>10mg</td><td>Once daily at bedtime</td><td>14 days</td><td>14 tabs</td></tr>
    <tr><td>4</td><td>Saline nasal spray</td><td>2 puffs each nostril</td><td>3 times daily</td><td>14 days</td><td>1 bottle</td></tr>
  </tbody>
</table>
<div class="kv" style="margin-bottom:8px"><span class="k">Diagnosis:</span><span class="v">Acute upper respiratory tract infection with allergic rhinitis (J06.9 / J30.9)</span></div>
<div class="kv"><span class="k">Notes:</span><span class="v">Complete antibiotic course even if symptoms improve. Avoid alcohol. Return if symptoms worsen after 3 days.</span></div>
<div style="margin-top:24px;display:flex;justify-content:space-between;align-items:flex-end">
  <div style="font-size:11px;color:#666">Pharmacist signature: _______________</div>
  <div style="text-align:center"><div style="border-top:1px solid #333;width:160px;margin:0 auto;padding-top:4px;font-size:11px">Dr. Somchai Rattana, M.D.<br>Reg. No. 42981</div></div>
</div>
<div class="foot">This prescription is valid for 30 days from date of issue.</div>
`),
    precomputed: {
      document_type: "prescription",
      confidence: 0.97,
      fields: {
        doctor_name:  { value: "Dr. Somchai Rattana, M.D.", confidence: 0.99 },
        patient_name: { value: "John Smith", confidence: 0.98 },
        date:         { value: "2024-05-12", confidence: 0.97 },
        medications: {
          value: [
            { name: "Amoxicillin 500mg capsules",  dosage: "500mg",        frequency: "3 times daily",          duration: "7 days",  quantity: "21 caps" },
            { name: "Paracetamol 500mg tablets",   dosage: "500–1000mg",   frequency: "Every 4–6 hours as needed", duration: "5 days", quantity: "20 tabs" },
            { name: "Cetirizine 10mg tablets",     dosage: "10mg",         frequency: "Once daily at bedtime",  duration: "14 days", quantity: "14 tabs" },
            { name: "Saline nasal spray",          dosage: "2 puffs/nostril", frequency: "3 times daily",       duration: "14 days", quantity: "1 bottle" },
          ],
          confidence: 0.96,
        },
      },
      validation_errors: [],
    },
  },

  // ── Prescription 2 ────────────────────────────────────────────
  {
    id: "sample-10",
    label: "Post-Surgical Prescription",
    type: "prescription",
    html: doc(`
<div class="hdr">
  <div class="org">Bangkok Hospital — Surgical Outpatient Department</div>
  <div class="org-sub">2 Soi Soonvijai 7, New Petchburi Rd, Bangkok 10310</div>
  <div class="doc-title">Discharge Prescription</div>
</div>
<div class="meta">
  <div><div class="lbl">Rx No.</div><div class="val">BKH-RX-240708-214</div></div>
  <div><div class="lbl">Patient Name</div><div class="val">Priya Sharma</div></div>
  <div><div class="lbl">Discharge Date</div><div class="val">08 July 2024</div></div>
  <div><div class="lbl">Prescribing Surgeon</div><div class="val">Dr. Wanlop Charoenwong, FACS</div></div>
</div>
<div style="background:#f0f4ff;border-left:4px solid #1d3557;padding:10px 14px;margin-bottom:16px;font-size:12px">
  <strong>Post-operative medications following laparoscopic appendectomy (05 July 2024)</strong>
</div>
<table>
  <thead><tr><th>#</th><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Qty</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Cephalexin 500mg capsules</td><td>500mg</td><td>4 times daily (every 6 hours)</td><td>7 days</td><td>28 caps</td></tr>
    <tr><td>2</td><td>Metronidazole 400mg tablets</td><td>400mg</td><td>3 times daily (with food)</td><td>5 days</td><td>15 tabs</td></tr>
    <tr><td>3</td><td>Ibuprofen 400mg tablets</td><td>400mg</td><td>Every 8 hours as needed for pain</td><td>7 days</td><td>21 tabs</td></tr>
    <tr><td>4</td><td>Omeprazole 20mg capsules</td><td>20mg</td><td>Once daily (30 min before breakfast)</td><td>14 days</td><td>14 caps</td></tr>
  </tbody>
</table>
<div class="kv" style="margin-bottom:8px"><span class="k">Allergy Alert:</span><span class="v">No known drug allergies (NKDA)</span></div>
<div class="kv"><span class="k">Special Instructions:</span><span class="v">Do not crush tablets. Take ibuprofen with food. Avoid alcohol for 48 hours after completing Metronidazole course.</span></div>
<div style="margin-top:24px;text-align:right">
  <div style="display:inline-block;text-align:center;border-top:1px solid #333;padding-top:4px;width:180px;font-size:11px">
    Dr. Wanlop Charoenwong, FACS<br>Surgical Reg. No. 38724
  </div>
</div>
<div class="foot">Follow-up appointment: 14 July 2024 · Bangkok Hospital Surgical OPD · Tel: +66 2 310 3000</div>
`),
    precomputed: {
      document_type: "prescription",
      confidence: 0.97,
      fields: {
        doctor_name:  { value: "Dr. Wanlop Charoenwong, FACS", confidence: 0.99 },
        patient_name: { value: "Priya Sharma", confidence: 0.98 },
        date:         { value: "2024-07-08", confidence: 0.97 },
        medications: {
          value: [
            { name: "Cephalexin 500mg capsules",    dosage: "500mg", frequency: "4 times daily",             duration: "7 days",  quantity: "28 caps" },
            { name: "Metronidazole 400mg tablets",  dosage: "400mg", frequency: "3 times daily (with food)", duration: "5 days",  quantity: "15 tabs" },
            { name: "Ibuprofen 400mg tablets",      dosage: "400mg", frequency: "Every 8 hours as needed",   duration: "7 days",  quantity: "21 tabs" },
            { name: "Omeprazole 20mg capsules",     dosage: "20mg",  frequency: "Once daily before breakfast",duration: "14 days", quantity: "14 caps" },
          ],
          confidence: 0.96,
        },
      },
      validation_errors: [],
    },
  },
];
