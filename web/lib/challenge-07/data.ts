export type ClaimType = "OUTPATIENT" | "INPATIENT" | "DENTAL";

export interface Icd10Code {
  code: string;
  description: string;
}

export interface Provider {
  name: string;
  type: "hospital" | "clinic" | "dental";
}

export interface Dependent {
  id: string;
  name: string;
  relation: "spouse" | "child";
  dob: string;
}

export interface MockMember {
  name: string;
  policyNumber: string;
  memberId: string;
  dateOfBirth: string;
  dependents: Dependent[];
}

export const mockMember: MockMember = {
  name: "Sarah Johnson",
  policyNumber: "POL-2024-TH-00789",
  memberId: "MEM-2024-001234",
  dateOfBirth: "1988-06-14",
  dependents: [
    { id: "dep-01", name: "Michael Johnson", relation: "spouse", dob: "1986-03-22" },
    { id: "dep-02", name: "Emma Johnson",    relation: "child",  dob: "2015-09-10" },
    { id: "dep-03", name: "Liam Johnson",    relation: "child",  dob: "2018-01-30" },
  ],
};

export const documentSchema: Record<ClaimType, { name: string; required: boolean }[]> = {
  OUTPATIENT: [
    { name: "Medical Receipt", required: true  },
    { name: "Prescription",    required: false },
  ],
  INPATIENT: [
    { name: "Discharge Summary", required: true },
    { name: "Itemized Bill",     required: true },
    { name: "Medical Receipt",   required: true },
  ],
  DENTAL: [
    { name: "Dental Receipt",  required: true  },
    { name: "Treatment Plan",  required: false },
  ],
};

export const providers: Provider[] = [
  { name: "Bangkok Hospital",              type: "hospital" },
  { name: "Bumrungrad International",      type: "hospital" },
  { name: "Samitivej Sukhumvit Hospital",  type: "hospital" },
  { name: "Vejthani Hospital",             type: "hospital" },
  { name: "BNH Hospital",                  type: "hospital" },
  { name: "Paolo Memorial Hospital",       type: "hospital" },
  { name: "Phyathai 2 Hospital",           type: "hospital" },
  { name: "Ramathibodi Hospital",          type: "hospital" },
  { name: "Siriraj Hospital",              type: "hospital" },
  { name: "Chulalongkorn Hospital",        type: "hospital" },
  { name: "Praram 9 Hospital",             type: "hospital" },
  { name: "Kasemrad International",        type: "hospital" },
  { name: "Saint Louis Hospital",          type: "hospital" },
  { name: "Bangkok Adventist Hospital",    type: "hospital" },
  { name: "Synphaet Hospital",             type: "hospital" },
  { name: "MedPark Hospital",              type: "hospital" },
  { name: "City Medical Clinic",           type: "clinic"   },
  { name: "Prime Care Clinic",             type: "clinic"   },
  { name: "Sukhumvit Clinic",              type: "clinic"   },
  { name: "Bangkok Smile Dental",          type: "dental"   },
  { name: "Dental World Thailand",         type: "dental"   },
  { name: "Absolute Dental",              type: "dental"   },
];

export const icd10Codes: Icd10Code[] = [
  // ── Respiratory (J) ──────────────────────────────────────────
  { code: "J00",   description: "Acute nasopharyngitis (common cold)" },
  { code: "J02.9", description: "Acute pharyngitis, unspecified" },
  { code: "J03.9", description: "Acute tonsillitis, unspecified" },
  { code: "J06.9", description: "Acute upper respiratory infection, unspecified" },
  { code: "J20.9", description: "Acute bronchitis, unspecified" },
  { code: "J22",   description: "Unspecified acute lower respiratory infection" },
  { code: "J30.1", description: "Allergic rhinitis due to pollen" },
  { code: "J30.9", description: "Allergic rhinitis, unspecified" },
  { code: "J32.9", description: "Chronic sinusitis, unspecified" },
  { code: "J40",   description: "Bronchitis, not specified as acute or chronic" },
  { code: "J42",   description: "Unspecified chronic bronchitis" },
  { code: "J45.20", description: "Mild intermittent asthma, uncomplicated" },
  { code: "J45.909", description: "Unspecified asthma, uncomplicated" },
  { code: "J18.9", description: "Pneumonia, unspecified organism" },
  { code: "J44.1", description: "Chronic obstructive pulmonary disease with acute exacerbation" },

  // ── Cardiovascular (I) ────────────────────────────────────────
  { code: "I10",   description: "Essential (primary) hypertension" },
  { code: "I20.9", description: "Angina pectoris, unspecified" },
  { code: "I21.9", description: "Acute myocardial infarction, unspecified" },
  { code: "I25.10", description: "Atherosclerotic heart disease of native coronary artery without angina" },
  { code: "I48.0", description: "Paroxysmal atrial fibrillation" },
  { code: "I48.91", description: "Unspecified atrial fibrillation" },
  { code: "I50.9", description: "Heart failure, unspecified" },
  { code: "I63.9", description: "Cerebral infarction, unspecified" },
  { code: "I64",   description: "Stroke, not specified as haemorrhage or infarction" },
  { code: "I83.90", description: "Asymptomatic varicose veins of unspecified lower extremity" },
  { code: "I87.2", description: "Venous insufficiency (chronic)(peripheral)" },
  { code: "I89.0", description: "Lymphedema, not elsewhere classified" },

  // ── Digestive (K) ─────────────────────────────────────────────
  { code: "K21.0", description: "Gastro-oesophageal reflux disease with oesophagitis" },
  { code: "K21.9", description: "Gastro-oesophageal reflux disease without oesophagitis" },
  { code: "K25.9", description: "Gastric ulcer, unspecified" },
  { code: "K29.70", description: "Gastritis, unspecified, without bleeding" },
  { code: "K35.80", description: "Other and unspecified acute appendicitis" },
  { code: "K40.90", description: "Unilateral inguinal hernia, without obstruction or gangrene" },
  { code: "K57.30", description: "Diverticulosis of large intestine without perforation or abscess" },
  { code: "K58.9", description: "Irritable bowel syndrome without diarrhoea" },
  { code: "K72.90", description: "Hepatic failure, unspecified without coma" },
  { code: "K74.60", description: "Unspecified cirrhosis of liver" },
  { code: "K80.20", description: "Calculus of gallbladder without cholecystitis, without obstruction" },
  { code: "K92.1", description: "Melaena" },

  // ── Musculoskeletal (M) ───────────────────────────────────────
  { code: "M10.9", description: "Gout, unspecified" },
  { code: "M17.11", description: "Primary osteoarthritis, right knee" },
  { code: "M17.12", description: "Primary osteoarthritis, left knee" },
  { code: "M19.90", description: "Unspecified osteoarthritis, unspecified site" },
  { code: "M47.816", description: "Spondylosis without myelopathy or radiculopathy, lumbar region" },
  { code: "M54.2", description: "Cervicalgia" },
  { code: "M54.5", description: "Low back pain" },
  { code: "M62.838", description: "Muscle spasm of other site" },
  { code: "M75.1", description: "Rotator cuff syndrome" },
  { code: "M79.3", description: "Panniculitis, unspecified" },

  // ── Endocrine / Metabolic (E) ─────────────────────────────────
  { code: "E03.9", description: "Hypothyroidism, unspecified" },
  { code: "E05.90", description: "Thyrotoxicosis, unspecified without thyrotoxic crisis" },
  { code: "E11.9", description: "Type 2 diabetes mellitus without complications" },
  { code: "E11.65", description: "Type 2 diabetes mellitus with hyperglycemia" },
  { code: "E66.9", description: "Obesity, unspecified" },
  { code: "E78.00", description: "Pure hypercholesterolaemia, unspecified" },
  { code: "E78.5", description: "Hyperlipidaemia, unspecified" },
  { code: "E83.52", description: "Hypercalcemia" },

  // ── Injury (S / T) ────────────────────────────────────────────
  { code: "S09.90XA", description: "Unspecified injury of head, initial encounter" },
  { code: "S13.4XXA", description: "Sprain of ligaments of cervical spine, initial encounter" },
  { code: "S52.501A", description: "Unspecified fracture of the lower end of right radius" },
  { code: "S62.001A", description: "Fracture of navicular bone of right wrist, initial encounter" },
  { code: "S82.001A", description: "Unspecified fracture of right patella, initial encounter" },
  { code: "S93.401A", description: "Sprain of unspecified ligament of right ankle, initial encounter" },
  { code: "T14.90", description: "Injury, unspecified" },
  { code: "T78.40XA", description: "Allergy, unspecified, initial encounter" },

  // ── Dental / Oral (K00–K14) ───────────────────────────────────
  { code: "K00.6", description: "Disturbances in tooth eruption" },
  { code: "K02.9", description: "Dental caries, unspecified" },
  { code: "K03.0", description: "Excessive attrition of teeth" },
  { code: "K04.0", description: "Pulpitis" },
  { code: "K04.7", description: "Periapical abscess without sinus" },
  { code: "K05.10", description: "Chronic gingivitis, plaque induced" },
  { code: "K05.30", description: "Chronic periodontitis, unspecified" },
  { code: "K08.401", description: "Partial loss of teeth due to extraction" },

  // ── Mental Health (F) ─────────────────────────────────────────
  { code: "F32.9", description: "Major depressive disorder, single episode, unspecified" },
  { code: "F41.1", description: "Generalized anxiety disorder" },
  { code: "F43.10", description: "Post-traumatic stress disorder, unspecified" },
  { code: "F50.00", description: "Anorexia nervosa, unspecified" },
  { code: "F51.01", description: "Primary insomnia" },

  // ── Neurological (G) ──────────────────────────────────────────
  { code: "G43.909", description: "Migraine, unspecified, not intractable, without status migrainosus" },
  { code: "G47.00", description: "Insomnia, unspecified" },
  { code: "G54.2", description: "Cervical root disorders, not elsewhere classified" },
  { code: "G62.9", description: "Polyneuropathy, unspecified" },
  { code: "G89.29", description: "Other chronic pain" },

  // ── Eye / Ear (H) ─────────────────────────────────────────────
  { code: "H00.014", description: "Hordeolum externum right lower eyelid" },
  { code: "H10.9", description: "Unspecified conjunctivitis" },
  { code: "H26.9", description: "Unspecified cataract" },
  { code: "H66.90", description: "Otitis media, unspecified, unspecified ear" },
  { code: "H92.09", description: "Otalgia, unspecified ear" },

  // ── Maternal / Pregnancy (O) ──────────────────────────────────
  { code: "O09.00", description: "Supervision of pregnancy with history of infertility, unspecified trimester" },
  { code: "O26.50", description: "Maternal hypotension syndrome, unspecified trimester" },
  { code: "O34.219", description: "Maternal care for unspecified type of previous cesarean" },
  { code: "O80",   description: "Encounter for full-term uncomplicated delivery" },
  { code: "O82",   description: "Encounter for cesarean delivery without indication" },

  // ── Preventive / Screening (Z) ────────────────────────────────
  { code: "Z00.00", description: "Encounter for general adult medical examination without abnormal findings" },
  { code: "Z00.121", description: "Encounter for routine child health examination with abnormal findings" },
  { code: "Z11.3", description: "Encounter for screening examination for infections with a predominantly sexual mode of transmission" },
  { code: "Z12.11", description: "Encounter for screening for malignant neoplasm of colon" },
  { code: "Z12.31", description: "Encounter for screening mammogram for malignant neoplasm of breast" },
  { code: "Z23",   description: "Encounter for immunization" },
  { code: "Z51.11", description: "Encounter for antineoplastic chemotherapy" },

  // ── Skin (L) ──────────────────────────────────────────────────
  { code: "L20.9", description: "Atopic dermatitis, unspecified" },
  { code: "L30.9", description: "Dermatitis, unspecified" },
  { code: "L40.0", description: "Psoriasis vulgaris" },
  { code: "L50.9", description: "Urticaria, unspecified" },
  { code: "L70.0", description: "Acne vulgaris" },

  // ── Urinary (N) ───────────────────────────────────────────────
  { code: "N10",   description: "Acute pyelonephritis" },
  { code: "N18.9", description: "Chronic kidney disease, unspecified" },
  { code: "N20.0", description: "Calculus of kidney" },
  { code: "N39.0", description: "Urinary tract infection, site not specified" },
  { code: "N40.0", description: "Benign prostatic hyperplasia without lower urinary tract symptoms" },
];
