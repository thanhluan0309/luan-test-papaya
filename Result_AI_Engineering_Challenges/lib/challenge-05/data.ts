export interface SubBenefit {
  name: string;
  limit_per_day?: number;
  limit_per_visit?: number;
  limit_per_event?: number;
  limit_per_year?: number;
  limit_per_pregnancy?: number;
  max_days?: number;
  visits_per_year?: number;
}

export interface Benefit {
  type: string;
  annual_limit?: number;
  lifetime_limit?: number;
  waiting_period_days?: number;
  sub_benefits: SubBenefit[];
}

export interface Policy {
  policy_number: string;
  policyholder: {
    name: string;
    type: string;
    industry: string;
    employee_count?: number;
  };
  plan: {
    name: string;
    tier: string;
    effective_date: string;
    expiry_date: string;
    currency: string;
  };
  members: {
    total: number;
    employee: number;
    dependent_spouse?: number;
    dependent_child?: number;
  };
  benefits: Benefit[];
  exclusions: string[];
  copay: Record<string, { percentage: number; max_per_visit?: number }>;
  network: {
    type: string;
    hospital_count: number;
    countries: string[];
  };
}

export const fmt = (n: number) => `฿${n.toLocaleString("en-US")}`;

const corporateGoldPolicy: Policy = {
  policy_number: "POL-2024-TH-00789",
  policyholder: {
    name: "Acme Corporation Ltd.",
    type: "Corporate",
    industry: "Technology",
    employee_count: 250,
  },
  plan: {
    name: "Corporate Health Plus",
    tier: "Gold",
    effective_date: "2024-01-01",
    expiry_date: "2024-12-31",
    currency: "THB",
  },
  members: {
    total: 750,
    employee: 250,
    dependent_spouse: 180,
    dependent_child: 320,
  },
  benefits: [
    {
      type: "Inpatient (IPD)",
      annual_limit: 2000000,
      sub_benefits: [
        { name: "Room & Board",  limit_per_day: 8000,   max_days: 120 },
        { name: "ICU",           limit_per_day: 16000,  max_days: 30  },
        { name: "Surgery",       limit_per_event: 500000               },
        { name: "Ambulance",     limit_per_event: 5000                 },
      ],
    },
    {
      type: "Outpatient (OPD)",
      annual_limit: 100000,
      sub_benefits: [
        { name: "Doctor Visit",        limit_per_visit: 3000, visits_per_year: 30 },
        { name: "Prescribed Medicine", limit_per_visit: 3000                      },
        { name: "Diagnostic Tests",    limit_per_year: 20000                      },
      ],
    },
    {
      type: "Dental",
      annual_limit: 30000,
      waiting_period_days: 90,
      sub_benefits: [
        { name: "Basic Dental", limit_per_year: 20000 },
        { name: "Major Dental", limit_per_year: 10000 },
      ],
    },
    {
      type: "Maternity",
      lifetime_limit: 200000,
      waiting_period_days: 270,
      sub_benefits: [
        { name: "Normal Delivery", limit_per_event: 100000        },
        { name: "C-Section",       limit_per_event: 200000        },
        { name: "Prenatal Care",   limit_per_pregnancy: 30000     },
      ],
    },
  ],
  exclusions: [
    "Pre-existing conditions within first 12 months",
    "Cosmetic surgery and elective procedures",
    "Self-inflicted injuries",
    "Injuries from extreme sports without prior declaration",
    "Treatment outside network hospitals without pre-authorization",
  ],
  copay: {
    Outpatient: { percentage: 20, max_per_visit: 500 },
    Inpatient:  { percentage: 0  },
    Dental:     { percentage: 30 },
  },
  network: {
    type: "Preferred Provider",
    hospital_count: 450,
    countries: ["Thailand", "Singapore", "Malaysia"],
  },
};

const personalBronzePolicy: Policy = {
  policy_number: "POL-2024-TH-00312",
  policyholder: {
    name: "Somchai Jaidee",
    type: "Individual",
    industry: "Freelance",
  },
  plan: {
    name: "Personal Essential",
    tier: "Bronze",
    effective_date: "2024-03-01",
    expiry_date: "2025-02-28",
    currency: "THB",
  },
  members: {
    total: 1,
    employee: 1,
  },
  benefits: [
    {
      type: "Inpatient (IPD)",
      annual_limit: 500000,
      sub_benefits: [
        { name: "Room & Board", limit_per_day: 2500,  max_days: 60  },
        { name: "ICU",          limit_per_day: 5000,  max_days: 15  },
        { name: "Surgery",      limit_per_event: 150000              },
        { name: "Ambulance",    limit_per_event: 2000                },
      ],
    },
    {
      type: "Outpatient (OPD)",
      annual_limit: 30000,
      sub_benefits: [
        { name: "Doctor Visit",        limit_per_visit: 1000, visits_per_year: 12 },
        { name: "Prescribed Medicine", limit_per_visit: 500                       },
        { name: "Diagnostic Tests",    limit_per_year: 5000                       },
      ],
    },
  ],
  exclusions: [
    "Pre-existing conditions within first 24 months",
    "Dental and vision care",
    "Maternity and pregnancy-related expenses",
    "Cosmetic surgery and non-medical procedures",
    "Chronic disease management outside of acute episodes",
    "Treatment outside Thailand",
  ],
  copay: {
    Outpatient: { percentage: 30, max_per_visit: 300 },
    Inpatient:  { percentage: 10, max_per_visit: 2000 },
  },
  network: {
    type: "Direct Billing Network",
    hospital_count: 120,
    countries: ["Thailand"],
  },
};

export const policies: Policy[] = [corporateGoldPolicy, personalBronzePolicy];
